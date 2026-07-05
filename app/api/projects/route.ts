import { getAllProjects, getPublishedProjects, createProject } from "@/lib/models/project"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get("published")
    
    let projects
    if (published === "true") {
      projects = await getPublishedProjects()
    } else {
      projects = await getAllProjects()
    }
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const project = await createProject({
      title: body.title,
      description: body.description,
      shortDescription: body.shortDescription,
      category: body.category,
      image: body.image,
      featured: body.featured || false,
      published: body.published || false,
      hardwareUsed: body.hardwareUsed || [],
      softwareUsed: body.softwareUsed || [],
      techStack: body.techStack || [],
      contributors: body.contributors || [],
      mentors: body.mentors || [],
      content: body.content || "",
      achievements: body.achievements || [],
      links: body.links || {},
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
