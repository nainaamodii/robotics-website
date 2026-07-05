// lib/models/team.ts
import { nanoid } from 'nanoid';
import { getDB } from '../db';
import { ObjectId } from 'mongodb';

export interface Team {
  _id?: ObjectId;
  name: string;
  teamCode: string;
  competitionId: ObjectId;
  leaderId: ObjectId;
  members: ObjectId[];
  isFinalized: boolean;
  createdAt: Date;
}

export async function createTeam(data: { name: string; leaderId: string; competitionId: string }) {
  const db = await getDB();
  const teamCode = nanoid(6).toUpperCase();

  const newTeam = {
    name: data.name,
    teamCode,
    competitionId: safeObjectId(data.competitionId),
    leaderId: safeObjectId(data.leaderId),
    members: [safeObjectId(data.leaderId)],
    isFinalized: false,
    createdAt: new Date(),
  };

  const result = await db.collection('teams').insertOne(newTeam);

  // FIX: Return the combined object so _id is accessible immediately
  return { ...newTeam, _id: result.insertedId };
}

export async function joinTeamByCode(userId: string, code: string) {
  const db = await getDB();
  // Find team, check if already finalized, add member
  const result = await db.collection('teams').findOneAndUpdate(
    { teamCode: code, isFinalized: false },
    { $addToSet: { members: safeObjectId(userId) } },
    { returnDocument: 'after' } // Returns the updated document
  );

  // MongoDB driver might return the doc directly or inside .value depending on version
  return result;
}

// FIX: Add this function to fetch team details with populated user data
export async function getTeamById(id: string) {
  const db = await getDB();
  if (!ObjectId.isValid(id)) return null;

  const pipeline = [
    { $match: { _id: new ObjectId(id) } },
    // SAFETY FIX: Ensure competitionId is treated as ObjectId for lookup
    {
      $addFields: {
        competitionIdObj: { $toObjectId: "$competitionId" }
      }
    },
    // Lookup User Details
    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        as: "memberDetails"
      }
    },
    // Lookup Competition using the converted Object
    {
      $lookup: {
        from: "competitions",
        localField: "competitionIdObj", // Use the converted field
        foreignField: "_id",
        as: "competitionDetails"
      }
    },
    {
      $unwind: {
        path: "$competitionDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        name: 1,
        teamCode: 1,
        isFinalized: 1,
        leaderId: 1,
        competitionId: 1,
        // Prioritize 'title', fallback to 'name', then default
        competitionName: {
          $ifNull: ["$competitionDetails.title", "$competitionDetails.name", "Unknown Competition"]
        },
        members: {
          $map: {
            input: "$memberDetails",
            as: "member",
            in: {
              _id: "$$member._id",
              name: "$$member.name",
              email: "$$member.email"
            }
          }
        }
      }
    }
  ];

  const results = await db.collection('teams').aggregate(pipeline).toArray();
  return results[0] || null;
}
export async function finalizeTeam(teamId: string, userId: string) {
  const db = await getDB();

  if (!ObjectId.isValid(teamId) || !ObjectId.isValid(userId)) {
    throw new Error("Invalid System ID Format");
  }

  const result = await db.collection('teams').findOneAndUpdate(
    {
      _id: safeObjectId(teamId),
      leaderId: safeObjectId(userId)
    },
    {
      $set: {
        isFinalized: true,
        finalizedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error("Unauthorized: Leader credentials mismatch or team not found");
  }

  return result;
}
export async function getUserTeamForCompetition(userId: string, competitionId: string) {
  const db = await getDB();
  return db.collection('teams').findOne({
    competitionId: safeObjectId(competitionId),
    members: safeObjectId(userId)
  });
}
function safeObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;
}

export async function getLatestTeamForUser(userId: string) {
  const db = await getDB();

  const pipeline = [
    // 1. Match teams where the user is a member
    { $match: { members: new ObjectId(userId) } },

    // 2. Sort by newest first
    { $sort: { createdAt: -1 } },

    // 3. Limit to 1 (Active Deployment)
    { $limit: 1 },

    // 4. Populate details (Same logic as getTeamById)
    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        as: "memberDetails"
      }
    },
    {
      $lookup: {
        from: "competitions",
        localField: "competitionId",
        foreignField: "_id",
        as: "competitionDetails"
      }
    },
    {
      $unwind: {
        path: "$competitionDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        name: 1,
        teamCode: 1,
        isFinalized: 1,
        leaderId: 1,
        competitionId: 1,
        competitionName: {
          $ifNull: ["$competitionDetails.title", "$competitionDetails.name", "Unknown Competition"]
        },
        members: {
          $map: {
            input: "$memberDetails",
            as: "member",
            in: {
              _id: "$$member._id",
              name: "$$member.name",
              email: "$$member.email"
            }
          }
        }
      }
    }
  ];

  const results = await db.collection('teams').aggregate(pipeline).toArray();
  return results[0] || null;
}

export async function getAllTeamsForUser(userId: string) {
  const db = await getDB();

  const pipeline = [
    // 1. Match teams where the user is a member
    { $match: { members: new ObjectId(userId) } },

    // 2. Sort by newest first
    { $sort: { createdAt: -1 } },

    // 3. (REMOVED LIMIT STAGE)

    // 4. Populate details
    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        as: "memberDetails"
      }
    },
    {
      $lookup: {
        from: "competitions",
        localField: "competitionId",
        foreignField: "_id",
        as: "competitionDetails"
      }
    },
    {
      $unwind: {
        path: "$competitionDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        name: 1,
        teamCode: 1,
        isFinalized: 1,
        leaderId: 1,
        competitionId: 1,
        competitionName: {
          $ifNull: ["$competitionDetails.title", "$competitionDetails.name", "Unknown Competition"]
        },
        members: {
          $map: {
            input: "$memberDetails",
            as: "member",
            in: {
              _id: "$$member._id",
              name: "$$member.name",
              email: "$$member.email"
            }
          }
        }
      }
    }
  ];

  return await db.collection('teams').aggregate(pipeline).toArray();
}