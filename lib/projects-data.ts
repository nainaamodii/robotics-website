export interface Contributor {
  name: string
  role: string
  github?: string
}

export interface Project {
  _id: string
  title: string
  description: string
  shortDescription: string
  category: string
  image: string
  featured: boolean
  published: boolean
  createdAt: string
  updatedAt: string

  // Detailed Information
  hardwareUsed: string[]
  softwareUsed: string[]
  techStack: string[]

  // Team
  contributors: Contributor[]
  mentors: Contributor[]

  // Content
  content: string // Markdown content
  achievements: string[]
  links: {
    github?: string
    documentation?: string
    demo?: string
  }
}

// Dummy data - will be replaced with MongoDB later
export const projectsData: Project[] = [
  {
    _id: "1",
    title: "Autonomous Line Follower",
    description:
      "An autonomous robot that follows a predefined line using advanced computer vision and PID control systems.",
    shortDescription: "Autonomous robot using computer vision and PID control",
    category: "Competition",
    image: "/autonomous-line-follower-robot.jpg",
    featured: true,
    published: true,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-09-20").toISOString(),
    hardwareUsed: [
      "Arduino Mega",
      "IR Sensors",
      "DC Motors",
      "Motor Drivers",
      "Power Distribution Board",
      "Aluminum Chassis",
    ],
    softwareUsed: ["Arduino IDE", "C++", "PID Control Library"],
    techStack: ["Image Processing", "PID Control Systems", "Sensor Integration", "Microcontroller Programming"],
    contributors: [
      { name: "Rahul Kumar", role: "Hardware Lead", github: "https://github.com" },
      { name: "Priya Sharma", role: "Software Lead", github: "https://github.com" },
      { name: "Aditya Singh", role: "Firmware Developer" },
    ],
    mentors: [
      { name: "Dr. Rajesh Verma", role: "Project Mentor" },
      { name: "Prof. Anita Gupta", role: "Technical Guide" },
    ],
    content: `# Autonomous Line Follower

## Overview
Our autonomous line follower robot is designed to navigate complex paths using advanced computer vision and precision control systems.

## Key Features
- Real-time line detection using IR sensors
- Adaptive PID control for smooth navigation
- Capable of handling sharp turns and intersections
- Power-efficient design for extended operation

## Technical Specifications
- Speed: 1.5 m/s
- Turn radius: 15cm
- Battery life: 2 hours
- Accuracy: ±2cm deviation

## Development Timeline
- **Phase 1 (Jan-Mar)**: Hardware assembly and testing
- **Phase 2 (Apr-Jun)**: Software development and optimization
- **Phase 3 (Jul-Aug)**: Integration and field testing
- **Phase 4 (Sep)**: Competition preparation

## Challenges & Solutions
We faced challenges with sensor calibration in varying lighting conditions. Our solution involved implementing adaptive thresholding and multiple sensor fusion techniques.

## Results & Achievements
- 1st place in ROBOMANIA 2024
- Successfully completed 10 test runs with 98% accuracy
- Patent pending for our unique sensor array design`,
    achievements: ["1st Place in ROBOMANIA 2024", "Featured in Tech Magazine", "98% Accuracy Rate"],
    links: {
      github: "https://github.com/mnnit-robotics/line-follower",
      documentation: "https://docs.example.com/line-follower",
      demo: "https://example.com/demo",
    },
  },
  {
    _id: "2",
    title: "Robotic Arm with Vision",
    description: "A 6-DOF robotic arm equipped with computer vision for object recognition and manipulation tasks.",
    shortDescription: "6-DOF robotic arm with integrated computer vision system",
    category: "Innovation",
    image: "/robotic-arm-vision-picking.jpg",
    featured: true,
    published: true,
    createdAt: new Date("2024-02-10").toISOString(),
    updatedAt: new Date("2024-10-05").toISOString(),
    hardwareUsed: [
      "Servo Motors (MG996R)",
      "Aluminum Framework",
      "USB Camera",
      "Raspberry Pi 4",
      "Power Supply (12V 30A)",
    ],
    softwareUsed: ["Python", "OpenCV", "ROS", "TensorFlow"],
    techStack: ["Computer Vision", "Machine Learning", "Kinematics", "ROS Framework", "Deep Learning"],
    contributors: [
      { name: "Vikram Patel", role: "Lead Developer", github: "https://github.com" },
      { name: "Neha Mishra", role: "Vision Engineer" },
      { name: "Arjun Verma", role: "Mechanical Design" },
      { name: "Zara Khan", role: "ML Specialist" },
    ],
    mentors: [
      { name: "Dr. Sanjay Kumar", role: "Computer Vision Guide" },
      { name: "Prof. Meera Singh", role: "Robotics Mentor" },
    ],
    content: `# Robotic Arm with Vision System

## Project Overview
This project demonstrates the integration of advanced computer vision with robotic manipulation, creating an intelligent system capable of autonomous object recognition and handling.

## System Architecture
The arm consists of 6 degrees of freedom, allowing it to reach any point in its workspace. The integrated camera feed is processed in real-time using deep learning models.

## Computer Vision Capabilities
- Object detection using YOLO
- Color segmentation for sorting tasks
- 3D pose estimation
- Real-time processing at 30 FPS

## Control System
- Inverse kinematics calculation for smooth movement
- Position control with feedback
- Force feedback integration
- Collision avoidance protocols

## Applications
- Automated pick and place operations
- Quality inspection
- Assembly line automation
- Research platform for manipulation

## Specifications
- Reach: 80cm
- Payload: 2kg
- Accuracy: ±1cm
- Speed: 1.5 m/s

## Future Enhancements
- Tactile feedback sensors
- Gripper force feedback
- Autonomous task planning`,
    achievements: ["Best Innovation Award 2024", "Published in robotics journal", "Demonstrated at IIT Workshop"],
    links: {
      github: "https://github.com/mnnit-robotics/robotic-arm",
      documentation: "https://docs.example.com/robotic-arm",
    },
  },
  {
    _id: "3",
    title: "Underwater Drone",
    description:
      "An autonomous underwater vehicle designed for exploration, research, and underwater inspection tasks.",
    shortDescription: "Autonomous underwater vehicle with multiple sensors",
    category: "Research",
    image: "/underwater-drone-robot-autonomous.jpg",
    featured: false,
    published: true,
    createdAt: new Date("2024-03-05").toISOString(),
    updatedAt: new Date("2024-09-15").toISOString(),
    hardwareUsed: [
      "Brushless DC Motors",
      "Waterproof Enclosure",
      "Pressure Sensors",
      "Temperature Sensors",
      "LIDAR",
      "Microcontroller (STM32)",
    ],
    softwareUsed: ["C/C++", "ROS", "Python", "SLAM Software"],
    techStack: ["Path Planning", "SLAM", "Underwater Robotics", "Sensor Fusion", "IoT"],
    contributors: [
      { name: "Sameer Desai", role: "Project Lead" },
      { name: "Isha Patel", role: "Software Engineer" },
      { name: "Rohan Singh", role: "Mechanical Engineer" },
      { name: "Maya Gupta", role: "Sensor Integration" },
    ],
    mentors: [
      { name: "Dr. Amit Joshi", role: "Research Advisor" },
      { name: "Prof. Kavita Sharma", role: "Technical Mentor" },
    ],
    content: `# Autonomous Underwater Drone

## Mission Overview
Designed for underwater exploration and environmental monitoring, our AUV combines cutting-edge robotics with marine engineering principles.

## Design Features
- Hydrodynamic hull design
- Six thrusters for omnidirectional movement
- Modular sensor payload bay
- 5-hour operational time at depth

## Navigation System
- SLAM-based autonomous navigation
- LIDAR-based obstacle avoidance
- GPS integration for surface positioning
- Real-time telemetry

## Sensor Suite
- Pressure sensors for depth measurement
- Temperature sensors for environmental data
- Sonar for obstacle detection
- Camera for visual documentation

## Operational Depth
- Maximum depth: 1000m capability
- Current testing depth: 100m
- Tested in controlled environments

## Environmental Monitoring
- Water temperature tracking
- Salinity measurements
- Marine life observation
- Seabed mapping

## Results
- Successfully completed 50+ test dives
- Capable of autonomous navigation over 2km
- Real-time data transmission`,
    achievements: ["Best Robotics Project 2024", "International recognition", "Patent filed for hull design"],
    links: {
      github: "https://github.com/mnnit-robotics/underwater-drone",
      documentation: "https://docs.example.com/underwater-drone",
    },
  },
  {
    _id: "4",
    title: "Drone Delivery System",
    description:
      "An aerial robot system capable of autonomous flight, package detection, and delivery in challenging environments.",
    shortDescription: "Autonomous aerial delivery platform with obstacle avoidance",
    category: "Innovation",
    image: "/drone-delivery-aerial-robot.jpg",
    featured: false,
    published: false,
    createdAt: new Date("2024-04-12").toISOString(),
    updatedAt: new Date("2024-08-30").toISOString(),
    hardwareUsed: [
      "Pixhawk Flight Controller",
      "ESC (Electronic Speed Controller)",
      "LiPo Battery",
      "Carbon Frame",
      "Brushless Motors",
      "Lidar Sensor",
    ],
    softwareUsed: ["Python", "ROS", "ArduPilot", "QGroundControl"],
    techStack: ["Path Planning", "Computer Vision", "IoT", "Aerial Robotics", "Flight Control"],
    contributors: [
      { name: "Harsh Malhotra", role: "Flight Systems Lead" },
      { name: "Shreya Nair", role: "Software Developer" },
      { name: "Karan Bhardwaj", role: "Electrical Engineer" },
      { name: "Divya Sharma", role: "Systems Integration" },
    ],
    mentors: [
      { name: "Dr. Ravi Kumar", role: "Aerial Robotics Expert" },
      { name: "Prof. Snehal Deshmukh", role: "Systems Mentor" },
    ],
    content: `# Autonomous Drone Delivery System

## System Overview
A complete autonomous aerial delivery platform designed to safely transport packages through urban and semi-urban environments.

## Flight Specifications
- Maximum payload: 2kg
- Flight time: 25 minutes
- Maximum speed: 25 m/s
- Operating altitude: up to 400ft

## Autonomy Features
- GPS-based waypoint navigation
- Real-time obstacle detection
- Autonomous landing and takeoff
- Return-to-home capability
- Emergency failsafe protocols

## Delivery Mechanism
- Automated package release system
- Soft landing capabilities
- Payload secure mounting

## Communication
- Real-time telemetry streaming
- 4G/LTE connectivity
- Remote monitoring dashboard
- Emergency manual override

## Testing Results
- 100+ successful autonomous flights
- 95% delivery success rate
- Tested in urban canyon environments
- Weather resistance up to wind speed 40 km/h

## Safety Features
- Geofencing
- No-fly zone detection
- Collision avoidance algorithms
- Redundant power systems`,
    achievements: [
      "Awarded Best Emerging Tech Project",
      "Partnership with local logistics company",
      "Featured in tech news",
    ],
    links: {
      github: "https://github.com/mnnit-robotics/drone-delivery",
      demo: "https://example.com/drone-demo",
    },
  },
]

export function getAllProjects(): Project[] {
  return projectsData
}

export function getPublishedProjects(): Project[] {
  return projectsData.filter((project) => project.published)
}

export function getProjectById(id: string): Project | null {
  return projectsData.find((project) => project._id === id) || null
}

export function getFeaturedProjects(): Project[] {
  return projectsData.filter((project) => project.featured && project.published)
}

export function togglePublished(id: string): void {
  const project = projectsData.find((p) => p._id === id)
  if (project) {
    project.published = !project.published
    project.updatedAt = new Date().toISOString()
  }
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projectIndex = projectsData.findIndex((p) => p._id === id)
  if (projectIndex === -1) return null

  projectsData[projectIndex] = {
    ...projectsData[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  return projectsData[projectIndex]
}

export function deleteProject(id: string): boolean {
  const index = projectsData.findIndex((p) => p._id === id)
  if (index === -1) return false
  projectsData.splice(index, 1)
  return true
}
