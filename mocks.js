// Comprehensive mobile-side mocks matching web app structure

// User database by role
const users = [
  {
    id: 1,
    email: 'leader@fpt.edu.vn',
    password: 'leader',
    role: 'leader',
    name: 'Leader User',
    status: 'Active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
  },
  {
    id: 2,
    email: 'lecturer@fpt.edu.vn',
    password: 'lecturer',
    role: 'lecturer',
    name: 'Lecturer User',
    status: 'Active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
  },
  {
    id: 3,
    email: 'admin@fpt.edu.vn',
    password: 'admin',
    role: 'admin',
    name: 'Admin User',
    status: 'Active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
  },
  {
    id: 4,
    email: 'academic@fpt.edu.vn',
    password: 'academic',
    role: 'academic',
    name: 'Academic Affairs',
    status: 'Active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
  },
  {
    id: 5,
    email: 'member@fpt.edu.vn',
    password: 'member',
    role: 'member',
    name: 'Member User',
    status: 'Active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
  },
];

// Comprehensive user management mocks
export const mockAllUsers = [
  // Demo Users
  {
    id: 1,
    email: 'leader@fpt.edu.vn',
    name: 'Nguyen Van Leader',
    type: 'Demo User',
    role: 'leader',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
    department: 'Computer Science',
    phone: '+84 123 456 789',
    address: 'FPT University, Hanoi'
  },
  {
    id: 2,
    email: 'lecturer@fpt.edu.vn',
    name: 'Dr. Tran Thi Lecturer',
    type: 'Demo User',
    role: 'lecturer',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
    department: 'Computer Science',
    phone: '+84 987 654 321',
    address: 'FPT University, Hanoi'
  },
  {
    id: 3,
    email: 'admin@fpt.edu.vn',
    name: 'Admin System',
    type: 'Demo User',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
    department: 'IT Administration',
    phone: '+84 555 123 456',
    address: 'FPT University, Hanoi'
  },
  {
    id: 4,
    email: 'academic@fpt.edu.vn',
    name: 'Academic Affairs Office',
    type: 'Demo User',
    role: 'academic',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
    department: 'Academic Affairs',
    phone: '+84 777 888 999',
    address: 'FPT University, Hanoi'
  },
  {
    id: 5,
    email: 'member@fpt.edu.vn',
    name: 'Le Van Member',
    type: 'Demo User',
    role: 'member',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-05-01',
    department: 'Computer Science',
    phone: '+84 111 222 333',
    address: 'FPT University, Hanoi'
  },
  // Additional Students
  {
    id: 6,
    email: 'student1@fpt.edu.vn',
    name: 'Pham Van Student',
    type: 'Student',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-05-01',
    studentId: 'SE123456',
    major: 'Software Engineering',
    year: 3,
    gpa: 3.5,
    phone: '+84 444 555 666',
    address: 'FPT University, Hanoi'
  },
  {
    id: 7,
    email: 'student2@fpt.edu.vn',
    name: 'Hoang Thi Student',
    type: 'Student',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-20',
    lastLogin: '2024-04-30',
    studentId: 'SE789012',
    major: 'Software Engineering',
    year: 2,
    gpa: 3.8,
    phone: '+84 666 777 888',
    address: 'FPT University, Hanoi'
  },
  {
    id: 8,
    email: 'student3@fpt.edu.vn',
    name: 'Vu Van Student',
    type: 'Student',
    role: 'student',
    status: 'inactive',
    createdAt: '2024-02-01',
    lastLogin: '2024-03-15',
    studentId: 'SE345678',
    major: 'Computer Science',
    year: 4,
    gpa: 3.2,
    phone: '+84 999 000 111',
    address: 'FPT University, Hanoi'
  },
  // Additional Lecturers
  {
    id: 9,
    email: 'lecturer2@fpt.edu.vn',
    name: 'Dr. Nguyen Van Lecturer',
    type: 'Lecturer',
    role: 'lecturer',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-05-01',
    department: 'Computer Science',
    specialization: 'IoT & Embedded Systems',
    hireDate: '2023-09-01',
    phone: '+84 222 333 444',
    address: 'FPT University, Hanoi'
  },
  {
    id: 10,
    email: 'lecturer3@fpt.edu.vn',
    name: 'Prof. Le Thi Lecturer',
    type: 'Lecturer',
    role: 'lecturer',
    status: 'active',
    createdAt: '2024-01-05',
    lastLogin: '2024-04-28',
    department: 'Software Engineering',
    specialization: 'Mobile Development',
    hireDate: '2023-08-15',
    phone: '+84 333 444 555',
    address: 'FPT University, Hanoi'
  }
];

// Mock login function
export async function mockLogin(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  return user;
}

export const demoUsers = users;

export const mockWallet = {
  balance: 500000,
  transactions: [
    { type: 'Deposit', amount: 100000, date: '2024-04-01' },
    { type: 'Rental', amount: -100000, date: '2024-04-02' },
  ],
};

// Mock group data
export const mockGroups = [
  {
    id: 1,
    name: 'Group 1',
    leader: 'leader@fpt.edu.vn',
    members: ['member@fpt.edu.vn'],
    lecturer: 'lecturer@fpt.edu.vn',
    description: 'IoT starter team',
  },
  {
    id: 2,
    name: 'IoT Project Team',
    leader: 'leader@fpt.edu.vn',
    members: ['member@fpt.edu.vn'],
    lecturer: 'lecturer@fpt.edu.vn',
  },
  {
    id: 3,
    name: 'Advanced Robotics',
    leader: 'member@fpt.edu.vn',
    members: [],
    lecturer: 'lecturer@fpt.edu.vn',
  },
  // Groups that members can join
  {
    id: 4,
    name: 'Smart Home IoT',
    leader: null,
    members: [],
    lecturer: 'lecturer@fpt.edu.vn',
    maxMembers: 4,
    description: 'Building smart home automation systems',
    status: 'open',
  },
  {
    id: 5,
    name: 'Environmental Monitoring',
    leader: null,
    members: [],
    lecturer: 'iot.specialist@fpt.edu.vn',
    maxMembers: 4,
    description: 'IoT sensors for environmental data collection',
    status: 'open',
  },
  {
    id: 6,
    name: 'Industrial IoT',
    leader: null,
    members: [],
    lecturer: 'sensor.expert@fpt.edu.vn',
    maxMembers: 4,
    description: 'Industrial automation and monitoring systems',
    status: 'open',
  },
];

// Mock kits data
export const mockKits = [
  {
    id: 1,
    name: 'IoT Starter Kit',
    quantity: 5,
    price: 100000,
    status: 'AVAILABLE',
    description: 'A basic IoT kit for beginners with Arduino Uno, sensors, and breadboard.',
    category: 'Basic',
    location: 'Lab 1',
    lastMaintenance: '2024-01-01',
    nextMaintenance: '2024-06-01',
    components: [
      { name: 'Arduino Uno', quantity: 1, condition: 'New' },
      { name: 'Breadboard', quantity: 1, condition: 'New' },
      { name: 'LEDs', quantity: 10, condition: 'New' },
      { name: 'Resistors', quantity: 20, condition: 'New' },
    ],
  },
  {
    id: 2,
    name: 'Advanced IoT Kit',
    quantity: 2,
    price: 200000,
    status: 'IN-USE',
    description: 'Advanced kit for IoT projects with Raspberry Pi and multiple sensors.',
    category: 'Advanced',
    location: 'Lab 2',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-07-01',
    components: [
      { name: 'Raspberry Pi', quantity: 1, condition: 'Used' },
      { name: 'Sensors', quantity: 5, condition: 'New' },
      { name: 'Camera Module', quantity: 1, condition: 'New' },
      { name: 'WiFi Module', quantity: 1, condition: 'New' },
    ],
  },
  {
    id: 3,
    name: 'Professional IoT Kit',
    quantity: 1,
    price: 500000,
    status: 'AVAILABLE',
    description: 'Professional grade IoT kit for advanced projects and research.',
    category: 'Professional',
    location: 'Lab 3',
    lastMaintenance: '2024-03-01',
    nextMaintenance: '2024-08-01',
    components: [
      { name: 'ESP32', quantity: 2, condition: 'New' },
      { name: 'OLED Display', quantity: 1, condition: 'New' },
      { name: 'Motor Driver', quantity: 1, condition: 'New' },
      { name: 'GPS Module', quantity: 1, condition: 'New' },
    ],
  },
  {
    id: 4,
    name: 'Robotics Kit',
    quantity: 3,
    price: 300000,
    status: 'DAMAGED',
    description: 'Complete robotics kit with motors, chassis, and control system.',
    category: 'Advanced',
    location: 'Lab 1',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-06-15',
    components: [
      { name: 'DC Motors', quantity: 4, condition: 'Used' },
      { name: 'Wheels', quantity: 4, condition: 'Used' },
      { name: 'Chassis', quantity: 1, condition: 'Damaged' },
      { name: 'Battery Pack', quantity: 1, condition: 'Used' },
    ],
  },
];

// Admin approvals
export const mockRentalRequests = [
  {
    id: 1,
    userId: 3,
    userName: 'Student User',
    userEmail: 'student@fpt.edu.vn',
    userRole: 'student',
    kitId: 1,
    kitName: 'IoT Starter Kit',
    duration: 7,
    startDate: '2024-05-10',
    endDate: '2024-05-17',
    totalCost: 70000,
    status: 'PENDING_APPROVAL',
    requestDate: '2024-05-01',
    reason: 'For IoT project assignment',
    purpose: 'Academic project',
    approvedBy: null,
    approvalDate: null,
  },
  {
    id: 2,
    userId: 8,
    userName: 'John Doe',
    userEmail: 'john.doe@fpt.edu.vn',
    userRole: 'student',
    kitId: 2,
    kitName: 'Advanced IoT Kit',
    duration: 14,
    startDate: '2024-05-15',
    endDate: '2024-05-29',
    totalCost: 280000,
    status: 'APPROVED',
    requestDate: '2024-05-02',
    reason: 'Research project on smart home automation',
    purpose: 'Research',
    approvedBy: 'admin@fpt.edu.vn',
    approvalDate: '2024-05-03',
  },
  {
    id: 4,
    userId: 4,
    userName: 'Leader User',
    userEmail: 'leader@fpt.edu.vn',
    userRole: 'leader',
    kitId: 1,
    kitName: 'IoT Starter Kit',
    duration: 5,
    startDate: '2024-05-25',
    endDate: '2024-05-30',
    totalCost: 50000,
    status: 'PENDING_APPROVAL',
    requestDate: '2024-05-04',
    reason: 'Group project demonstration',
    purpose: 'Academic project',
    approvedBy: null,
    approvalDate: null,
  },
];

export const mockRefundRequests = [
  {
    id: 1,
    userEmail: 'member@fpt.edu.vn',
    kitName: 'Advanced IoT Kit',
    originalAmount: 280000,
    refundAmount: 280000,
    status: 'pending'
  },
];

// Mock system statistics for admin dashboard
export const mockSystemStats = {
  totalUsers: 150,
  activeUsers: 120,
  totalKits: 25,
  availableKits: 15,
  rentedKits: 8,
  damagedKits: 2,
  totalRentals: 45,
  pendingApprovals: 5,
  totalRevenue: 2500000,
  monthlyRevenue: 500000,
  popularKits: [
    { name: 'IoT Starter Kit', rentals: 15 },
    { name: 'Advanced IoT Kit', rentals: 12 },
    { name: 'Robotics Kit', rentals: 8 },
  ],
  recentActivity: [
    { action: 'New rental request', user: 'student@fpt.edu.vn', time: '2024-05-01 10:30' },
    { action: 'Kit returned', user: 'lecturer@fpt.edu.vn', time: '2024-05-01 09:15' },
    { action: 'Refund approved', user: 'admin@fpt.edu.vn', time: '2024-05-01 08:45' },
    { action: 'New user registered', user: 'john.doe@fpt.edu.vn', time: '2024-05-01 08:30' },
  ],
};

// Comprehensive Academic Portal Data
export const mockSemesters = [
  { 
    id: 1, 
    name: 'Fall 2024', 
    startDate: '2024-09-01', 
    endDate: '2024-12-20', 
    status: 'Active',
    description: 'Fall semester 2024 with IoT and embedded systems focus',
    totalStudents: 150,
    totalClasses: 12,
    totalLecturers: 8
  },
  { 
    id: 2, 
    name: 'Spring 2025', 
    startDate: '2025-01-15', 
    endDate: '2025-05-10', 
    status: 'Upcoming',
    description: 'Spring semester 2025 with advanced IoT topics',
    totalStudents: 0,
    totalClasses: 0,
    totalLecturers: 0
  },
  { 
    id: 3, 
    name: 'Summer 2024', 
    startDate: '2024-06-01', 
    endDate: '2024-08-15', 
    status: 'Completed',
    description: 'Summer intensive program completed',
    totalStudents: 75,
    totalClasses: 6,
    totalLecturers: 4
  }
];

export const mockClasses = [
  { 
    id: 1, 
    name: 'IoT Fundamentals', 
    semesterId: 1, 
    semesterName: 'Fall 2024',
    lecturerId: 4,
    lecturerName: 'Dr. Nguyen Van IoT', 
    capacity: 30, 
    enrolledCount: 28, 
    status: 'Active',
    description: 'Introduction to Internet of Things concepts and applications',
    schedule: 'Mon/Wed/Fri 9:00-10:30',
    room: 'Lab A-101',
    credits: 3,
    prerequisites: 'Basic Programming'
  },
  { 
    id: 2, 
    name: 'Embedded Systems', 
    semesterId: 2, 
    semesterName: 'Spring 2025',
    lecturerId: 5,
    lecturerName: 'Dr. Le Van Embedded', 
    capacity: 20, 
    enrolledCount: 0, 
    status: 'Upcoming',
    description: 'Design and implementation of embedded systems',
    schedule: 'Tue/Thu 14:00-15:30',
    room: 'Lab B-201',
    credits: 4,
    prerequisites: 'Digital Electronics'
  },
  { 
    id: 3, 
    name: 'IoT Sensor Networks', 
    semesterId: 1, 
    semesterName: 'Fall 2024',
    lecturerId: 6,
    lecturerName: 'Dr. Tran Thi Sensor', 
    capacity: 25, 
    enrolledCount: 22, 
    status: 'Active',
    description: 'Wireless sensor networks for IoT applications',
    schedule: 'Mon/Wed 11:00-12:30',
    room: 'Lab A-102',
    credits: 3,
    prerequisites: 'IoT Fundamentals'
  },
  { 
    id: 4, 
    name: 'IoT Security and Privacy', 
    semesterId: 2, 
    semesterName: 'Spring 2025',
    lecturerId: 7,
    lecturerName: 'Dr. Pham Van Security', 
    capacity: 25, 
    enrolledCount: 0, 
    status: 'Upcoming',
    description: 'Security challenges and solutions in IoT systems',
    schedule: 'Tue/Thu 9:00-10:30',
    room: 'Lab C-301',
    credits: 3,
    prerequisites: 'Network Security'
  },
  { 
    id: 5, 
    name: 'IoT Project Development', 
    semesterId: 1, 
    semesterName: 'Fall 2024',
    lecturerId: 8,
    lecturerName: 'Dr. Hoang Thi Project', 
    capacity: 15, 
    enrolledCount: 12, 
    status: 'Active',
    description: 'Hands-on IoT project development and implementation',
    schedule: 'Fri 14:00-17:00',
    room: 'Project Lab',
    credits: 4,
    prerequisites: 'IoT Fundamentals, Embedded Systems'
  }
];

// Comprehensive IoT Subjects for Academic Portal
export const mockIotSubjects = [
  {
    id: 1,
    name: 'Internet of Things Fundamentals',
    semesterId: 1,
    semesterName: 'Fall 2024',
    lecturerId: 4,
    lecturerName: 'Dr. Nguyen Van IoT',
    capacity: 30,
    enrolledCount: 28,
    status: 'Active',
    description: 'Introduction to IoT concepts, architectures, and applications',
    schedule: 'Mon/Wed/Fri 9:00-10:30',
    room: 'Lab A-101',
    credits: 3,
    prerequisites: 'Basic Programming, Digital Electronics',
    learningObjectives: [
      'Understand IoT architecture and components',
      'Learn IoT communication protocols',
      'Design basic IoT applications',
      'Implement sensor data collection'
    ]
  },
  {
    id: 2,
    name: 'IoT Sensor Networks',
    semesterId: 1,
    semesterName: 'Fall 2024',
    lecturerId: 6,
    lecturerName: 'Dr. Tran Thi Sensor',
    capacity: 25,
    enrolledCount: 22,
    status: 'Active',
    description: 'Wireless sensor networks for IoT applications',
    schedule: 'Mon/Wed 11:00-12:30',
    room: 'Lab A-102',
    credits: 3,
    prerequisites: 'IoT Fundamentals',
    learningObjectives: [
      'Design wireless sensor networks',
      'Implement data aggregation techniques',
      'Optimize network performance',
      'Handle sensor node failures'
    ]
  },
  {
    id: 3,
    name: 'Embedded Systems Design',
    semesterId: 2,
    semesterName: 'Spring 2025',
    lecturerId: 5,
    lecturerName: 'Dr. Le Van Embedded',
    capacity: 20,
    enrolledCount: 0,
    status: 'Upcoming',
    description: 'Design and implementation of embedded systems for IoT',
    schedule: 'Tue/Thu 14:00-15:30',
    room: 'Lab B-201',
    credits: 4,
    prerequisites: 'Digital Electronics, Microcontrollers',
    learningObjectives: [
      'Design embedded system architectures',
      'Program microcontrollers for IoT',
      'Implement real-time systems',
      'Optimize power consumption'
    ]
  },
  {
    id: 4,
    name: 'IoT Security and Privacy',
    semesterId: 2,
    semesterName: 'Spring 2025',
    lecturerId: 7,
    lecturerName: 'Dr. Pham Van Security',
    capacity: 25,
    enrolledCount: 0,
    status: 'Upcoming',
    description: 'Security challenges and solutions in IoT systems',
    schedule: 'Tue/Thu 9:00-10:30',
    room: 'Lab C-301',
    credits: 3,
    prerequisites: 'Network Security, IoT Fundamentals',
    learningObjectives: [
      'Identify IoT security vulnerabilities',
      'Implement security protocols',
      'Design secure IoT architectures',
      'Handle privacy concerns'
    ]
  },
  {
    id: 5,
    name: 'IoT Project Development',
    semesterId: 1,
    semesterName: 'Fall 2024',
    lecturerId: 8,
    lecturerName: 'Dr. Hoang Thi Project',
    capacity: 15,
    enrolledCount: 12,
    status: 'Active',
    description: 'Hands-on IoT project development and implementation',
    schedule: 'Fri 14:00-17:00',
    room: 'Project Lab',
    credits: 4,
    prerequisites: 'IoT Fundamentals, Embedded Systems',
    learningObjectives: [
      'Develop complete IoT solutions',
      'Manage IoT project lifecycle',
      'Integrate multiple IoT components',
      'Present and demonstrate projects'
    ]
  }
];

// Academic Statistics
export const mockAcademicStats = {
  totalSemesters: 3,
  activeSemesters: 1,
  totalStudents: 150,
  activeStudents: 120,
  totalLecturers: 8,
  activeLecturers: 6,
  totalClasses: 12,
  activeClasses: 8,
  totalIotSubjects: 5,
  activeIotSubjects: 3,
  enrollmentRate: 85.5,
  averageClassSize: 24.5,
  graduationRate: 92.3
};

// Student Enrollments
export const mockEnrollments = [
  {
    id: 1,
    studentId: 6,
    studentName: 'Pham Van Student',
    studentEmail: 'student1@fpt.edu.vn',
    classId: 1,
    className: 'IoT Fundamentals',
    semesterId: 1,
    semesterName: 'Fall 2024',
    enrollmentDate: '2024-08-15',
    status: 'Active',
    grade: null,
    attendance: 95.5
  },
  {
    id: 2,
    studentId: 7,
    studentName: 'Hoang Thi Student',
    studentEmail: 'student2@fpt.edu.vn',
    classId: 1,
    className: 'IoT Fundamentals',
    semesterId: 1,
    semesterName: 'Fall 2024',
    enrollmentDate: '2024-08-16',
    status: 'Active',
    grade: null,
    attendance: 88.2
  },
  {
    id: 3,
    studentId: 6,
    studentName: 'Pham Van Student',
    studentEmail: 'student1@fpt.edu.vn',
    classId: 3,
    className: 'IoT Sensor Networks',
    semesterId: 1,
    semesterName: 'Fall 2024',
    enrollmentDate: '2024-08-20',
    status: 'Active',
    grade: null,
    attendance: 92.1
  },
  {
    id: 4,
    studentId: 7,
    studentName: 'Hoang Thi Student',
    studentEmail: 'student2@fpt.edu.vn',
    classId: 5,
    className: 'IoT Project Development',
    semesterId: 1,
    semesterName: 'Fall 2024',
    enrollmentDate: '2024-08-25',
    status: 'Active',
    grade: null,
    attendance: 100.0
  }
];

// Academic Assignments
export const mockAssignments = [
  {
    id: 1,
    classId: 1,
    className: 'IoT Fundamentals',
    title: 'IoT Architecture Design',
    description: 'Design and document a complete IoT system architecture for a smart home application',
    dueDate: '2024-10-15',
    maxPoints: 100,
    assignmentType: 'Project',
    status: 'Active',
    submissions: 25,
    averageScore: 87.5,
    createdDate: '2024-09-15'
  },
  {
    id: 2,
    classId: 1,
    className: 'IoT Fundamentals',
    title: 'Sensor Data Analysis',
    description: 'Analyze temperature and humidity data from IoT sensors and create visualizations',
    dueDate: '2024-11-01',
    maxPoints: 50,
    assignmentType: 'Lab',
    status: 'Active',
    submissions: 22,
    averageScore: 91.2,
    createdDate: '2024-10-01'
  },
  {
    id: 3,
    classId: 3,
    className: 'IoT Sensor Networks',
    title: 'Wireless Sensor Network Simulation',
    description: 'Simulate a wireless sensor network using NS-3 and analyze performance metrics',
    dueDate: '2024-11-20',
    maxPoints: 75,
    assignmentType: 'Simulation',
    status: 'Active',
    submissions: 18,
    averageScore: 84.3,
    createdDate: '2024-10-15'
  },
  {
    id: 4,
    classId: 5,
    className: 'IoT Project Development',
    title: 'Final IoT Project',
    description: 'Develop a complete IoT solution addressing a real-world problem',
    dueDate: '2024-12-10',
    maxPoints: 200,
    assignmentType: 'Final Project',
    status: 'Active',
    submissions: 10,
    averageScore: null,
    createdDate: '2024-09-01'
  }
];

// Academic Logs for Academic Affairs Portal
export const mockAcademicLogs = [
  {
    id: 1,
    timestamp: new Date('2024-09-01T08:30:00').toISOString(),
    action: 'SEMESTER_CREATED',
    type: 'semester',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      semesterName: 'Fall 2024',
      semesterId: 1,
      startDate: '2024-09-01',
      endDate: '2024-12-20',
      createdBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 2,
    timestamp: new Date('2024-09-05T10:15:00').toISOString(),
    action: 'STUDENT_ENROLLED',
    type: 'enrollment',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      studentName: 'Pham Van Student',
      studentEmail: 'student1@fpt.edu.vn',
      className: 'IoT Fundamentals',
      classId: 1,
      semesterName: 'Fall 2024',
      enrolledBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 3,
    timestamp: new Date('2024-09-10T14:20:00').toISOString(),
    action: 'LECTURER_ASSIGNED',
    type: 'assignment',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      lecturerName: 'Dr. Nguyen Van IoT',
      lecturerEmail: 'lecturer2@fpt.edu.vn',
      className: 'IoT Fundamentals',
      classId: 1,
      assignedBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 4,
    timestamp: new Date('2024-09-15T09:45:00').toISOString(),
    action: 'ASSIGNMENT_CREATED',
    type: 'assignment',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      assignmentTitle: 'IoT Architecture Design',
      assignmentId: 1,
      className: 'IoT Fundamentals',
      classId: 1,
      dueDate: '2024-10-15',
      createdBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 5,
    timestamp: new Date('2024-10-01T11:30:00').toISOString(),
    action: 'GRADE_UPDATED',
    type: 'grade',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      studentName: 'Pham Van Student',
      studentEmail: 'student1@fpt.edu.vn',
      assignmentTitle: 'IoT Architecture Design',
      assignmentId: 1,
      grade: 92,
      maxPoints: 100,
      updatedBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 6,
    timestamp: new Date('2024-10-05T16:15:00').toISOString(),
    action: 'STUDENT_DROPPED',
    type: 'enrollment',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      studentName: 'Vu Van Student',
      studentEmail: 'student3@fpt.edu.vn',
      className: 'IoT Sensor Networks',
      classId: 3,
      reason: 'Schedule conflict',
      droppedBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 7,
    timestamp: new Date('2024-10-10T13:20:00').toISOString(),
    action: 'CLASS_CAPACITY_UPDATED',
    type: 'class',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      className: 'IoT Fundamentals',
      classId: 1,
      oldCapacity: 25,
      newCapacity: 30,
      reason: 'High demand',
      updatedBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  },
  {
    id: 8,
    timestamp: new Date('2024-10-15T10:00:00').toISOString(),
    action: 'SEMESTER_ACTIVATED',
    type: 'semester',
    user: 'academic@fpt.edu.vn',
    userName: 'Academic Affairs',
    details: {
      semesterName: 'Fall 2024',
      semesterId: 1,
      activationDate: '2024-10-15',
      activatedBy: 'academic@fpt.edu.vn'
    },
    status: 'SUCCESS'
  }
];

// Comprehensive Lecturer Data for Academic Portal
export const mockAcademicLecturers = [
  {
    id: 4,
    name: 'Dr. Nguyen Van IoT',
    email: 'iot.specialist@fpt.edu.vn',
    department: 'Computer Science',
    specialization: 'IoT & Embedded Systems',
    hireDate: '2023-09-01',
    status: 'Active',
    phone: '+84 123 456 789',
    address: 'FPT University, Hanoi',
    classes: ['IoT Fundamentals', 'IoT Project Development'],
    totalStudents: 40,
    researchAreas: ['IoT Architecture', 'Sensor Networks', 'Edge Computing']
  },
  {
    id: 5,
    name: 'Dr. Le Van Embedded',
    email: 'embedded.systems@fpt.edu.vn',
    department: 'Computer Science',
    specialization: 'Embedded Systems',
    hireDate: '2023-08-15',
    status: 'Active',
    phone: '+84 987 654 321',
    address: 'FPT University, Hanoi',
    classes: ['Embedded Systems Design'],
    totalStudents: 0,
    researchAreas: ['Microcontrollers', 'Real-time Systems', 'Hardware Design']
  },
  {
    id: 6,
    name: 'Dr. Tran Thi Sensor',
    email: 'sensor.expert@fpt.edu.vn',
    department: 'Computer Science',
    specialization: 'Sensor Networks',
    hireDate: '2023-10-01',
    status: 'Active',
    phone: '+84 555 123 456',
    address: 'FPT University, Hanoi',
    classes: ['IoT Sensor Networks'],
    totalStudents: 22,
    researchAreas: ['Wireless Sensors', 'Data Fusion', 'Network Protocols']
  },
  {
    id: 7,
    name: 'Dr. Pham Van Security',
    email: 'security.analyst@fpt.edu.vn',
    department: 'Computer Science',
    specialization: 'IoT Security',
    hireDate: '2023-11-01',
    status: 'Active',
    phone: '+84 777 888 999',
    address: 'FPT University, Hanoi',
    classes: ['IoT Security and Privacy'],
    totalStudents: 0,
    researchAreas: ['IoT Security', 'Cryptography', 'Privacy Protection']
  },
  {
    id: 8,
    name: 'Dr. Hoang Thi Project',
    email: 'project.manager@fpt.edu.vn',
    department: 'Computer Science',
    specialization: 'Project Management',
    hireDate: '2023-12-01',
    status: 'Active',
    phone: '+84 111 222 333',
    address: 'FPT University, Hanoi',
    classes: ['IoT Project Development'],
    totalStudents: 12,
    researchAreas: ['Project Management', 'Agile Development', 'IoT Solutions']
  }
];

// Academic Reports
export const mockAcademicReports = [
  {
    id: 1,
    title: 'Fall 2024 Enrollment Report',
    type: 'enrollment',
    semesterId: 1,
    semesterName: 'Fall 2024',
    generatedDate: '2024-09-15',
    generatedBy: 'academic@fpt.edu.vn',
    summary: {
      totalEnrollments: 62,
      newEnrollments: 45,
      droppedEnrollments: 3,
      enrollmentRate: 85.5,
      topClasses: ['IoT Fundamentals', 'IoT Sensor Networks', 'IoT Project Development']
    },
    status: 'Completed'
  },
  {
    id: 2,
    title: 'Student Performance Analysis',
    type: 'performance',
    semesterId: 1,
    semesterName: 'Fall 2024',
    generatedDate: '2024-10-01',
    generatedBy: 'academic@fpt.edu.vn',
    summary: {
      averageGrade: 87.5,
      passRate: 94.2,
      topPerformers: 15,
      atRiskStudents: 3,
      improvementAreas: ['IoT Security', 'Embedded Programming']
    },
    status: 'Completed'
  },
  {
    id: 3,
    title: 'Lecturer Workload Report',
    type: 'workload',
    semesterId: 1,
    semesterName: 'Fall 2024',
    generatedDate: '2024-09-20',
    generatedBy: 'academic@fpt.edu.vn',
    summary: {
      totalLecturers: 6,
      averageClassSize: 24.5,
      workloadDistribution: 'Balanced',
      overloadedLecturers: 0,
      underutilizedLecturers: 1
    },
    status: 'Completed'
  }
];

// Comprehensive Student Data for Academic Portal
export const mockAcademicStudents = [
  {
    id: 6,
    name: 'Pham Van Student',
    email: 'student1@fpt.edu.vn',
    studentId: 'SE123456',
    major: 'Software Engineering',
    year: 3,
    gpa: 3.5,
    status: 'Active',
    phone: '+84 444 555 666',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2022-09-01',
    expectedGraduation: '2025-05-15',
    advisor: 'Dr. Nguyen Van IoT',
    advisorEmail: 'iot.specialist@fpt.edu.vn',
    enrolledClasses: ['IoT Fundamentals', 'IoT Sensor Networks'],
    totalCredits: 18,
    completedCredits: 90,
    attendance: 95.5,
    lastLogin: '2024-05-01'
  },
  {
    id: 7,
    name: 'Hoang Thi Student',
    email: 'student2@fpt.edu.vn',
    studentId: 'SE789012',
    major: 'Software Engineering',
    year: 2,
    gpa: 3.8,
    status: 'Active',
    phone: '+84 666 777 888',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2023-09-01',
    expectedGraduation: '2026-05-15',
    advisor: 'Dr. Hoang Thi Project',
    advisorEmail: 'project.manager@fpt.edu.vn',
    enrolledClasses: ['IoT Fundamentals', 'IoT Project Development'],
    totalCredits: 15,
    completedCredits: 45,
    attendance: 88.2,
    lastLogin: '2024-04-30'
  },
  {
    id: 8,
    name: 'Vu Van Student',
    email: 'student3@fpt.edu.vn',
    studentId: 'SE345678',
    major: 'Computer Science',
    year: 4,
    gpa: 3.2,
    status: 'Inactive',
    phone: '+84 999 000 111',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2021-09-01',
    expectedGraduation: '2024-12-15',
    advisor: 'Dr. Tran Thi Sensor',
    advisorEmail: 'sensor.expert@fpt.edu.vn',
    enrolledClasses: [],
    totalCredits: 0,
    completedCredits: 120,
    attendance: 75.0,
    lastLogin: '2024-03-15'
  },
  {
    id: 9,
    name: 'Nguyen Thi Student',
    email: 'student4@fpt.edu.vn',
    studentId: 'SE901234',
    major: 'Software Engineering',
    year: 3,
    gpa: 3.9,
    status: 'Active',
    phone: '+84 222 333 444',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2022-09-01',
    expectedGraduation: '2025-05-15',
    advisor: 'Dr. Pham Van Security',
    advisorEmail: 'security.analyst@fpt.edu.vn',
    enrolledClasses: ['IoT Sensor Networks'],
    totalCredits: 12,
    completedCredits: 78,
    attendance: 98.5,
    lastLogin: '2024-05-01'
  },
  {
    id: 10,
    name: 'Tran Van Student',
    email: 'student5@fpt.edu.vn',
    studentId: 'SE567890',
    major: 'Computer Science',
    year: 2,
    gpa: 3.6,
    status: 'Active',
    phone: '+84 888 999 000',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2023-09-01',
    expectedGraduation: '2026-05-15',
    advisor: 'Dr. Le Van Embedded',
    advisorEmail: 'embedded.systems@fpt.edu.vn',
    enrolledClasses: ['IoT Project Development'],
    totalCredits: 9,
    completedCredits: 36,
    attendance: 92.1,
    lastLogin: '2024-04-28'
  },
  {
    id: 11,
    name: 'Le Thi Student',
    email: 'student6@fpt.edu.vn',
    studentId: 'SE234567',
    major: 'Software Engineering',
    year: 4,
    gpa: 3.7,
    status: 'Active',
    phone: '+84 111 222 333',
    address: 'FPT University, Hanoi',
    enrollmentDate: '2021-09-01',
    expectedGraduation: '2024-12-15',
    advisor: 'Dr. Nguyen Van IoT',
    advisorEmail: 'iot.specialist@fpt.edu.vn',
    enrolledClasses: ['IoT Fundamentals', 'IoT Sensor Networks', 'IoT Project Development'],
    totalCredits: 21,
    completedCredits: 105,
    attendance: 100.0,
    lastLogin: '2024-05-01'
  }
];

// Academic Notifications
export const mockAcademicNotifications = [
  {
    id: 1,
    title: 'New Semester Registration Open',
    message: 'Registration for Spring 2025 semester is now open. Students can enroll in IoT courses.',
    type: 'info',
    priority: 'high',
    createdDate: '2024-10-01',
    expiryDate: '2024-11-01',
    targetAudience: 'students',
    status: 'active'
  },
  {
    id: 2,
    title: 'Assignment Due Reminder',
    message: 'IoT Architecture Design assignment is due on October 15, 2024. Please submit on time.',
    type: 'warning',
    priority: 'medium',
    createdDate: '2024-10-10',
    expiryDate: '2024-10-15',
    targetAudience: 'students',
    status: 'active'
  },
  {
    id: 3,
    title: 'Lecturer Meeting Scheduled',
    message: 'Monthly lecturer meeting scheduled for October 20, 2024 at 2:00 PM in Conference Room A.',
    type: 'info',
    priority: 'medium',
    createdDate: '2024-10-05',
    expiryDate: '2024-10-20',
    targetAudience: 'lecturers',
    status: 'active'
  }
];

// Lecturer Performance and Workload Data
export const mockLecturerPerformance = [
  {
    id: 4,
    lecturerName: 'Dr. Nguyen Van IoT',
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    semesterId: 1,
    semesterName: 'Fall 2024',
    totalClasses: 2,
    totalStudents: 40,
    averageRating: 4.8,
    totalHours: 120,
    researchHours: 40,
    administrativeHours: 20,
    performanceScore: 95.5,
    studentFeedback: [
      { rating: 5, comment: 'Excellent IoT knowledge and teaching methods' },
      { rating: 4, comment: 'Great practical examples and hands-on projects' },
      { rating: 5, comment: 'Very helpful and responsive to questions' }
    ]
  },
  {
    id: 5,
    lecturerName: 'Dr. Le Van Embedded',
    lecturerEmail: 'embedded.systems@fpt.edu.vn',
    semesterId: 2,
    semesterName: 'Spring 2025',
    totalClasses: 1,
    totalStudents: 0,
    averageRating: 4.6,
    totalHours: 60,
    researchHours: 30,
    administrativeHours: 15,
    performanceScore: 92.3,
    studentFeedback: [
      { rating: 5, comment: 'Deep knowledge in embedded systems' },
      { rating: 4, comment: 'Good theoretical foundation' },
      { rating: 4, comment: 'Could use more practical examples' }
    ]
  },
  {
    id: 6,
    lecturerName: 'Dr. Tran Thi Sensor',
    lecturerEmail: 'sensor.expert@fpt.edu.vn',
    semesterId: 1,
    semesterName: 'Fall 2024',
    totalClasses: 1,
    totalStudents: 22,
    averageRating: 4.7,
    totalHours: 90,
    researchHours: 35,
    administrativeHours: 18,
    performanceScore: 94.1,
    studentFeedback: [
      { rating: 5, comment: 'Expert in sensor networks and data analysis' },
      { rating: 4, comment: 'Clear explanations of complex concepts' },
      { rating: 5, comment: 'Great lab sessions and demonstrations' }
    ]
  }
];

// Lecturer Schedule and Availability
export const mockLecturerSchedules = [
  {
    id: 4,
    lecturerName: 'Dr. Nguyen Van IoT',
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { time: '09:00-10:30', class: 'IoT Fundamentals', room: 'Lab A-101' },
          { time: '14:00-15:30', availability: 'Office Hours', room: 'Office A-201' }
        ]
      },
      {
        day: 'Wednesday',
        timeSlots: [
          { time: '09:00-10:30', class: 'IoT Fundamentals', room: 'Lab A-101' },
          { time: '11:00-12:30', availability: 'Research Time', room: 'Research Lab' }
        ]
      },
      {
        day: 'Friday',
        timeSlots: [
          { time: '09:00-10:30', class: 'IoT Fundamentals', room: 'Lab A-101' },
          { time: '14:00-17:00', class: 'IoT Project Development', room: 'Project Lab' }
        ]
      }
    ],
    officeHours: 'Mon/Wed 14:00-15:30',
    officeLocation: 'Office A-201',
    availability: 'Available'
  },
  {
    id: 6,
    lecturerName: 'Dr. Tran Thi Sensor',
    lecturerEmail: 'sensor.expert@fpt.edu.vn',
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { time: '11:00-12:30', class: 'IoT Sensor Networks', room: 'Lab A-102' }
        ]
      },
      {
        day: 'Wednesday',
        timeSlots: [
          { time: '11:00-12:30', class: 'IoT Sensor Networks', room: 'Lab A-102' },
          { time: '14:00-15:30', availability: 'Office Hours', room: 'Office B-202' }
        ]
      }
    ],
    officeHours: 'Wed 14:00-15:30',
    officeLocation: 'Office B-202',
    availability: 'Available'
  }
];

// Lecturer Borrow Status Data
export const mockLecturerBorrowStatus = [
  {
    id: 1,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'IoT Starter Kit',
    borrowDate: '2024-01-01',
    returnDate: '2024-01-15',
    status: 'borrowed',
    purpose: 'Teaching IoT Fundamentals',
    kitId: 'KIT001',
    location: 'Lab A-101',
    expectedReturn: '2024-01-15',
    actualReturn: null,
    notes: 'For semester project demonstration'
  },
  {
    id: 2,
    lecturerEmail: 'sensor.expert@fpt.edu.vn',
    kitName: 'Sensor Network Kit',
    borrowDate: '2024-01-05',
    returnDate: '2024-01-20',
    status: 'returned',
    purpose: 'Research on sensor networks',
    kitId: 'KIT002',
    location: 'Lab A-102',
    expectedReturn: '2024-01-20',
    actualReturn: '2024-01-18',
    notes: 'Early return - research completed'
  },
  {
    id: 3,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'Raspberry Pi Kit',
    borrowDate: '2024-01-10',
    returnDate: '2024-01-25',
    status: 'borrowed',
    purpose: 'Student project supervision',
    kitId: 'KIT003',
    location: 'Project Lab',
    expectedReturn: '2024-01-25',
    actualReturn: null,
    notes: 'For final year project guidance'
  },
  {
    id: 4,
    lecturerEmail: 'embedded.systems@fpt.edu.vn',
    kitName: 'Arduino Starter Kit',
    borrowDate: '2024-01-08',
    returnDate: '2024-01-22',
    status: 'returned',
    purpose: 'Embedded systems workshop',
    kitId: 'KIT004',
    location: 'Workshop Room B',
    expectedReturn: '2024-01-22',
    actualReturn: '2024-01-22',
    notes: 'Workshop completed successfully'
  },
  {
    id: 5,
    lecturerEmail: 'security.analyst@fpt.edu.vn',
    kitName: 'ESP32 Development Kit',
    borrowDate: '2024-01-12',
    returnDate: '2024-01-27',
    status: 'borrowed',
    purpose: 'IoT Security research',
    kitId: 'KIT005',
    location: 'Security Lab',
    expectedReturn: '2024-01-27',
    actualReturn: null,
    notes: 'Testing security vulnerabilities'
  },
  {
    id: 6,
    lecturerEmail: 'project.manager@fpt.edu.vn',
    kitName: 'IoT Sensor Kit',
    borrowDate: '2024-01-03',
    returnDate: '2024-01-18',
    status: 'returned',
    purpose: 'Project management training',
    kitId: 'KIT006',
    location: 'Training Room C',
    expectedReturn: '2024-01-18',
    actualReturn: '2024-01-16',
    notes: 'Training session completed early'
  }
];

// Lecturer Fines Data
export const mockLecturerFines = [
  {
    id: 1,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'Raspberry Pi Kit',
    fineAmount: 50000,
    reason: 'Late return',
    dueDate: '2024-01-15',
    status: 'pending',
    issueDate: '2024-01-10',
    kitId: 'KIT003',
    daysLate: 3,
    description: 'Returned 3 days after due date',
    paymentMethod: null,
    paidDate: null
  },
  {
    id: 2,
    lecturerEmail: 'sensor.expert@fpt.edu.vn',
    kitName: 'IoT Sensor Kit',
    fineAmount: 75000,
    reason: 'Kit damage',
    dueDate: '2024-01-20',
    status: 'paid',
    issueDate: '2024-01-12',
    kitId: 'KIT002',
    daysLate: 0,
    description: 'Sensor module damaged during research',
    paymentMethod: 'Bank Transfer',
    paidDate: '2024-01-14'
  },
  {
    id: 3,
    lecturerEmail: 'embedded.systems@fpt.edu.vn',
    kitName: 'Arduino Starter Kit',
    fineAmount: 30000,
    reason: 'Late return',
    dueDate: '2024-01-22',
    status: 'pending',
    issueDate: '2024-01-23',
    kitId: 'KIT004',
    daysLate: 1,
    description: 'Returned 1 day after due date',
    paymentMethod: null,
    paidDate: null
  },
  {
    id: 4,
    lecturerEmail: 'security.analyst@fpt.edu.vn',
    kitName: 'ESP32 Development Kit',
    fineAmount: 100000,
    reason: 'Kit damage',
    dueDate: '2024-01-27',
    status: 'paid',
    issueDate: '2024-01-28',
    kitId: 'KIT005',
    daysLate: 0,
    description: 'Board damaged during security testing',
    paymentMethod: 'Credit Card',
    paidDate: '2024-01-30'
  },
  {
    id: 5,
    lecturerEmail: 'project.manager@fpt.edu.vn',
    kitName: 'IoT Sensor Kit',
    fineAmount: 25000,
    reason: 'Late return',
    dueDate: '2024-01-18',
    status: 'paid',
    issueDate: '2024-01-19',
    kitId: 'KIT006',
    daysLate: 1,
    description: 'Returned 1 day after due date',
    paymentMethod: 'Cash',
    paidDate: '2024-01-20'
  },
  {
    id: 6,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'IoT Starter Kit',
    fineAmount: 150000,
    reason: 'Kit damage',
    dueDate: '2024-01-15',
    status: 'pending',
    issueDate: '2024-01-16',
    kitId: 'KIT001',
    daysLate: 0,
    description: 'Multiple components damaged during demonstration',
    paymentMethod: null,
    paidDate: null
  }
];

// Lecturer Refunds Data
export const mockLecturerRefunds = [
  {
    id: 1,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'Arduino Starter Kit',
    refundAmount: 200000,
    reason: 'Kit malfunction',
    requestDate: '2024-01-10',
    status: 'pending',
    purpose: 'Project completion',
    kitId: 'KIT004',
    description: 'Arduino board not functioning properly',
    approvalDate: null,
    processedDate: null,
    refundMethod: null
  },
  {
    id: 2,
    lecturerEmail: 'embedded.systems@fpt.edu.vn',
    kitName: 'ESP32 Development Kit',
    refundAmount: 150000,
    reason: 'Wrong kit delivered',
    requestDate: '2024-01-08',
    status: 'approved',
    purpose: 'Research project',
    kitId: 'KIT005',
    description: 'Received wrong model of ESP32 board',
    approvalDate: '2024-01-12',
    processedDate: '2024-01-15',
    refundMethod: 'Bank Transfer'
  },
  {
    id: 3,
    lecturerEmail: 'sensor.expert@fpt.edu.vn',
    kitName: 'IoT Sensor Kit',
    refundAmount: 300000,
    reason: 'Kit malfunction',
    requestDate: '2024-01-05',
    status: 'approved',
    purpose: 'Research on sensor networks',
    kitId: 'KIT002',
    description: 'Multiple sensors not responding',
    approvalDate: '2024-01-08',
    processedDate: '2024-01-10',
    refundMethod: 'Credit Card'
  },
  {
    id: 4,
    lecturerEmail: 'security.analyst@fpt.edu.vn',
    kitName: 'Raspberry Pi Kit',
    refundAmount: 250000,
    reason: 'Kit damage',
    requestDate: '2024-01-15',
    status: 'pending',
    purpose: 'IoT Security research',
    kitId: 'KIT003',
    description: 'Kit damaged during shipping',
    approvalDate: null,
    processedDate: null,
    refundMethod: null
  },
  {
    id: 5,
    lecturerEmail: 'project.manager@fpt.edu.vn',
    kitName: 'IoT Starter Kit',
    refundAmount: 180000,
    reason: 'Kit malfunction',
    requestDate: '2024-01-12',
    status: 'rejected',
    purpose: 'Project management training',
    kitId: 'KIT001',
    description: 'Components not working as expected',
    approvalDate: '2024-01-18',
    processedDate: null,
    refundMethod: null,
    rejectionReason: 'Kit tested and found to be functional'
  },
  {
    id: 6,
    lecturerEmail: 'iot.specialist@fpt.edu.vn',
    kitName: 'Sensor Network Kit',
    refundAmount: 220000,
    reason: 'Wrong kit delivered',
    requestDate: '2024-01-20',
    status: 'approved',
    purpose: 'Teaching IoT Fundamentals',
    kitId: 'KIT006',
    description: 'Received basic sensor kit instead of network kit',
    approvalDate: '2024-01-22',
    processedDate: '2024-01-25',
    refundMethod: 'Bank Transfer'
  }
];

// Mock fines data for admin portal
export const mockFines = [
  {
    id: 1,
    kitName: 'Advanced IoT Kit',
    studentName: 'John Doe',
    studentEmail: 'john.doe@fpt.edu.vn',
    leaderName: 'Leader User',
    leaderEmail: 'leader@fpt.edu.vn',
    fineAmount: 150000,
    status: 'pending',
    createdAt: '2024-05-06T11:30:00.000Z',
    dueDate: '2024-05-20T11:30:00.000Z',
    damageAssessment: {
      'Temperature Sensor': { damaged: 1, value: 100000 },
      'WiFi Module': { damaged: 1, value: 50000 }
    },
    rentalId: 2,
    kitId: 2
  },
  {
    id: 2,
    kitName: 'Basic Arduino Kit',
    studentName: 'Jane Smith',
    studentEmail: 'jane.smith@fpt.edu.vn',
    leaderName: 'Leader User',
    leaderEmail: 'leader@fpt.edu.vn',
    fineAmount: 75000,
    status: 'paid',
    createdAt: '2024-05-01T09:15:00.000Z',
    dueDate: '2024-05-15T09:15:00.000Z',
    paidDate: '2024-05-10T14:20:00.000Z',
    damageAssessment: {
      'Arduino Board': { damaged: 1, value: 75000 }
    },
    rentalId: 3,
    kitId: 1
  },
  {
    id: 3,
    kitName: 'Sensor Kit',
    studentName: 'Mike Wilson',
    studentEmail: 'mike.wilson@fpt.edu.vn',
    leaderName: 'Leader User',
    leaderEmail: 'leader@fpt.edu.vn',
    fineAmount: 200000,
    status: 'overdue',
    createdAt: '2024-04-25T16:45:00.000Z',
    dueDate: '2024-05-09T16:45:00.000Z',
    damageAssessment: {
      'Motion Sensor': { damaged: 1, value: 120000 },
      'Light Sensor': { damaged: 1, value: 80000 }
    },
    rentalId: 4,
    kitId: 3
  },
  {
    id: 4,
    kitName: 'Raspberry Pi Kit',
    studentName: 'Sarah Jones',
    studentEmail: 'sarah.jones@fpt.edu.vn',
    leaderName: 'Leader User',
    leaderEmail: 'leader@fpt.edu.vn',
    fineAmount: 300000,
    status: 'pending',
    createdAt: '2024-05-08T10:30:00.000Z',
    dueDate: '2024-05-22T10:30:00.000Z',
    damageAssessment: {
      'Raspberry Pi Board': { damaged: 1, value: 200000 },
      'SD Card': { damaged: 1, value: 100000 }
    },
    rentalId: 5,
    kitId: 4
  }
];

// Mock transaction history for mobile admin portal
export const mockTransactions = [
  {
    id: 1,
    transactionId: 'TXN-2024-001',
    userId: 3,
    userName: 'Student User',
    userEmail: 'student@fpt.edu.vn',
    userRole: 'student',
    type: 'RENTAL_PAYMENT',
    amount: 70000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Payment for IoT Starter Kit rental (7 days)',
    kitId: 1,
    kitName: 'IoT Starter Kit',
    rentalId: 1,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-01 10:30:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'RENT-2024-001',
    notes: 'Standard rental payment'
  },
  {
    id: 2,
    transactionId: 'TXN-2024-002',
    userId: 8,
    userName: 'John Doe',
    userEmail: 'john.doe@fpt.edu.vn',
    userRole: 'student',
    type: 'RENTAL_PAYMENT',
    amount: 280000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Payment for Advanced IoT Kit rental (14 days)',
    kitId: 2,
    kitName: 'Advanced IoT Kit',
    rentalId: 2,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-02 14:15:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'RENT-2024-002',
    notes: 'Research project rental'
  },
  {
    id: 3,
    transactionId: 'TXN-2024-003',
    userId: 9,
    userName: 'Jane Smith',
    userEmail: 'jane.smith@fpt.edu.vn',
    userRole: 'lecturer',
    type: 'RENTAL_PAYMENT',
    amount: 500000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Payment for Professional IoT Kit rental (30 days)',
    kitId: 3,
    kitName: 'Professional IoT Kit',
    rentalId: 3,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-03 09:45:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'RENT-2024-003',
    notes: 'Teaching course development'
  },
  {
    id: 4,
    transactionId: 'TXN-2024-004',
    userId: 3,
    userName: 'Student User',
    userEmail: 'student@fpt.edu.vn',
    userRole: 'student',
    type: 'FINE_PAYMENT',
    amount: 50000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Late return fine for IoT Starter Kit',
    kitId: 1,
    kitName: 'IoT Starter Kit',
    rentalId: 1,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-05 16:20:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'FINE-2024-001',
    notes: '2 days late return'
  },
  {
    id: 5,
    transactionId: 'TXN-2024-005',
    userId: 8,
    userName: 'John Doe',
    userEmail: 'john.doe@fpt.edu.vn',
    userRole: 'student',
    type: 'DAMAGE_FINE',
    amount: 150000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Damage fine for Advanced IoT Kit - Broken sensor',
    kitId: 2,
    kitName: 'Advanced IoT Kit',
    rentalId: 2,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-06 11:30:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'DAMAGE-2024-001',
    notes: 'Temperature sensor damaged during use'
  },
  {
    id: 6,
    transactionId: 'TXN-2024-006',
    userId: 10,
    userName: 'Alice Johnson',
    userEmail: 'alice.johnson@fpt.edu.vn',
    userRole: 'student',
    type: 'RENTAL_PAYMENT',
    amount: 350000,
    currency: 'VND',
    status: 'PENDING',
    description: 'Payment for IoT Development Kit rental (21 days)',
    kitId: 4,
    kitName: 'IoT Development Kit',
    rentalId: 4,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-07 13:45:00',
    processedBy: null,
    reference: 'RENT-2024-004',
    notes: 'Pending approval'
  },
  {
    id: 7,
    transactionId: 'TXN-2024-007',
    userId: 11,
    userName: 'Bob Wilson',
    userEmail: 'bob.wilson@fpt.edu.vn',
    userRole: 'student',
    type: 'REFUND',
    amount: -70000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Refund for cancelled IoT Starter Kit rental',
    kitId: 1,
    kitName: 'IoT Starter Kit',
    rentalId: 5,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-08 10:15:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'REFUND-2024-001',
    notes: 'Cancelled due to schedule conflict'
  },
  {
    id: 8,
    transactionId: 'TXN-2024-008',
    userId: 12,
    userName: 'Carol Davis',
    userEmail: 'carol.davis@fpt.edu.vn',
    userRole: 'lecturer',
    type: 'RENTAL_PAYMENT',
    amount: 400000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Payment for IoT Research Kit rental (28 days)',
    kitId: 5,
    kitName: 'IoT Research Kit',
    rentalId: 6,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-09 15:30:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'RENT-2024-005',
    notes: 'Research project rental'
  },
  {
    id: 9,
    transactionId: 'TXN-2024-009',
    userId: 13,
    userName: 'David Brown',
    userEmail: 'david.brown@fpt.edu.vn',
    userRole: 'student',
    type: 'DEPOSIT',
    amount: 200000,
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Wallet deposit',
    kitId: null,
    kitName: null,
    rentalId: null,
    paymentMethod: 'BANK_TRANSFER',
    transactionDate: '2024-05-10 09:00:00',
    processedBy: 'admin@fpt.edu.vn',
    reference: 'DEPOSIT-2024-001',
    notes: 'Initial wallet funding'
  },
  {
    id: 10,
    transactionId: 'TXN-2024-010',
    userId: 14,
    userName: 'Eva Garcia',
    userEmail: 'eva.garcia@fpt.edu.vn',
    userRole: 'student',
    type: 'RENTAL_PAYMENT',
    amount: 120000,
    currency: 'VND',
    status: 'FAILED',
    description: 'Payment for Basic IoT Kit rental (10 days)',
    kitId: 6,
    kitName: 'Basic IoT Kit',
    rentalId: 7,
    paymentMethod: 'WALLET',
    transactionDate: '2024-05-11 14:20:00',
    processedBy: null,
    reference: 'RENT-2024-006',
    notes: 'Insufficient wallet balance'
  }
];

// Mock log history for mobile admin portal
export const mockLogHistory = [
  {
    id: 1,
    timestamp: new Date('2024-01-15T10:30:00').toISOString(),
    action: 'RENTAL_REQUEST_BORROWED',
    type: 'rental',
    user: 'john.doe@fpt.edu.vn',
    userName: 'John Doe',
    details: {
      kitName: 'Arduino Starter Kit',
      kitId: 'ARD-001',
      requestId: 'REQ-2024-001',
      reason: 'IoT Fundamentals Course Project',
      duration: '2 weeks'
    },
    status: 'BORROWED',
    adminAction: 'borrowed',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-15T11:15:00').toISOString()
  },
  {
    id: 2,
    timestamp: new Date('2024-01-20T14:20:00').toISOString(),
    action: 'RENTAL_REQUEST_RETURNED',
    type: 'rental',
    user: 'john.doe@fpt.edu.vn',
    userName: 'John Doe',
    details: {
      kitName: 'Arduino Starter Kit',
      kitId: 'ARD-001',
      requestId: 'REQ-2024-001',
      returnedBy: 'admin@fpt.edu.vn',
      returnNotes: 'Kit returned in good condition'
    },
    status: 'RETURNED',
    adminAction: 'returned',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-20T14:20:00').toISOString()
  },
  {
    id: 3,
    timestamp: new Date('2024-01-20T14:20:00').toISOString(),
    action: 'REFUND_REQUEST_REJECTED',
    type: 'refund',
    user: 'jane.smith@fpt.edu.vn',
    userName: 'Jane Smith',
    details: {
      kitName: 'Raspberry Pi Kit',
      kitId: 'RPI-002',
      requestId: 'REF-2024-001',
      reason: 'Kit damaged during use',
      damageDescription: 'Broken GPIO pins',
      originalRentalId: 'RENT-2024-005',
      rejectedBy: 'admin@fpt.edu.vn',
      rejectionReason: 'Damage appears to be user negligence',
      fineAmount: 50
    },
    status: 'REJECTED',
    adminAction: 'rejected',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-20T15:45:00').toISOString()
  },
  {
    id: 4,
    timestamp: new Date('2024-01-22T09:10:00').toISOString(),
    action: 'RENTAL_REQUEST_BORROWED',
    type: 'rental',
    user: 'mike.wilson@fpt.edu.vn',
    userName: 'Mike Wilson',
    details: {
      kitName: 'Sensor Kit',
      kitId: 'SEN-003',
      requestId: 'REQ-2024-002',
      reason: 'Research project on environmental monitoring',
      duration: '1 month'
    },
    status: 'BORROWED',
    adminAction: 'borrowed',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-22T10:30:00').toISOString()
  },
  {
    id: 5,
    timestamp: new Date('2024-01-25T16:20:00').toISOString(),
    action: 'RENTAL_REQUEST_RETURNED',
    type: 'rental',
    user: 'mike.wilson@fpt.edu.vn',
    userName: 'Mike Wilson',
    details: {
      kitName: 'Sensor Kit',
      kitId: 'SEN-003',
      requestId: 'REQ-2024-002',
      returnedBy: 'admin@fpt.edu.vn',
      returnNotes: 'Kit returned with minor wear'
    },
    status: 'RETURNED',
    adminAction: 'returned',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-25T16:20:00').toISOString()
  },
  {
    id: 6,
    timestamp: new Date('2024-01-28T11:15:00').toISOString(),
    action: 'REFUND_REQUEST_REJECTED',
    type: 'refund',
    user: 'sarah.jones@fpt.edu.vn',
    userName: 'Sarah Jones',
    details: {
      kitName: 'Microcontroller Kit',
      kitId: 'MCU-004',
      requestId: 'REF-2024-002',
      reason: 'Kit not working properly',
      damageDescription: 'Power supply issues',
      originalRentalId: 'RENT-2024-008',
      rejectedBy: 'admin@fpt.edu.vn',
      rejectionReason: 'Issue was present before rental',
      fineAmount: 0
    },
    status: 'REJECTED',
    adminAction: 'rejected',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-01-28T11:15:00').toISOString()
  },
  {
    id: 7,
    timestamp: new Date('2024-02-01T08:30:00').toISOString(),
    action: 'FINE_PAID',
    type: 'fine',
    user: 'alice.johnson@fpt.edu.vn',
    userName: 'Alice Johnson',
    details: {
      kitName: 'IoT Development Kit',
      kitId: 'IOT-005',
      fineId: 'FINE-2024-001',
      fineAmount: 75000,
      damageAssessment: {
        'Temperature Sensor': { damaged: 1, value: 50000 },
        'WiFi Module': { damaged: 1, value: 25000 }
      },
      paidBy: 'alice.johnson@fpt.edu.vn',
      paymentNotes: 'Fine paid by student'
    },
    status: 'PAID',
    adminAction: 'paid',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-02-01T08:30:00').toISOString()
  },
  {
    id: 8,
    timestamp: new Date('2024-02-05T13:45:00').toISOString(),
    action: 'USER_CREATED',
    type: 'user',
    user: 'admin@fpt.edu.vn',
    userName: 'Admin User',
    details: {
      newUserEmail: 'bob.wilson@fpt.edu.vn',
      newUserName: 'Bob Wilson',
      newUserRole: 'student',
      createdBy: 'admin@fpt.edu.vn'
    },
    status: 'SUCCESS',
    adminAction: 'created',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-02-05T13:45:00').toISOString()
  },
  {
    id: 9,
    timestamp: new Date('2024-02-10T16:20:00').toISOString(),
    action: 'KIT_MAINTENANCE',
    type: 'kit',
    user: 'admin@fpt.edu.vn',
    userName: 'Admin User',
    details: {
      kitName: 'Advanced IoT Kit',
      kitId: 'ADV-002',
      maintenanceType: 'routine_check',
      maintenanceNotes: 'All components tested and working properly',
      performedBy: 'admin@fpt.edu.vn'
    },
    status: 'COMPLETED',
    adminAction: 'maintenance',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-02-10T16:20:00').toISOString()
  },
  {
    id: 10,
    timestamp: new Date('2024-02-15T09:15:00').toISOString(),
    action: 'GROUP_CREATED',
    type: 'group',
    user: 'admin@fpt.edu.vn',
    userName: 'Admin User',
    details: {
      groupName: 'Smart Home IoT Team',
      groupId: 'GRP-003',
      leaderEmail: 'leader@fpt.edu.vn',
      memberCount: 4,
      createdBy: 'admin@fpt.edu.vn'
    },
    status: 'SUCCESS',
    adminAction: 'created',
    adminUser: 'admin@fpt.edu.vn',
    adminTimestamp: new Date('2024-02-15T09:15:00').toISOString()
  }
];


