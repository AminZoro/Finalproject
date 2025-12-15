
let mockUsers = [
    {
        _id: '1',
        name: 'John Doe',
        email: 'john@teamflow.com',
        role: 'admin',
        avatarColor: 'bg-blue-500'
    },
    {
        _id: '2',
        name: 'Selena Kyle',
        email: 'Selena@teamflow.com',
        role: 'project_manager',
        avatarColor: 'bg-green-500'
    },
    {
        _id: '3',
        name: 'Alex Mason',
        email: 'alex@teamflow.com',
        role: 'member',
        avatarColor: 'bg-purple-500'
    },
    {
        _id: '4',
        name: 'Maria Garcia',
        email: 'maria@teamflow.com',
        role: 'member',
        avatarColor: 'bg-pink-500'
    },
    {
        _id: '5',
        name: 'David Wilson',
        email: 'david@teamflow.com',
        role: 'member',
        avatarColor: 'bg-yellow-500'
    }
];

// Mock Projects Database
let mockProjects = [
    {
        _id: '1',
        name: 'Website Redesign',
        description: 'Redesign company website',
        status: 'active',
        createdBy: '1',
        members: [
            { userId: '1', role: 'admin' },
            { userId: '2', role: 'member' },
            { userId: '3', role: 'member' }
        ],
        createdAt: new Date().toISOString()
    },
    {
        _id: '2',
        name: 'Mobile App',
        description: 'Develop new mobile application',
        status: 'planning',
        createdBy: '2',
        members: [
            { userId: '2', role: 'admin' },
            { userId: '4', role: 'member' }
        ],
        createdAt: new Date().toISOString()
    },
    {
        _id: '3',
        name: 'Marketing Campaign',
        description: 'Q4 marketing strategy',
        status: 'completed',
        createdBy: '1',
        members: [
            { userId: '1', role: 'admin' },
            { userId: '5', role: 'member' },
            { userId: '3', role: 'member' }
        ],
        createdAt: new Date().toISOString()
    }
];

// Mock Tasks Database
let mockTasks = [
    {
        _id: '1',
        title: 'Design homepage',
        description: 'Create new homepage design',
        status: 'todo',
        priority: 'high',
        project: '1',
        projectName: 'Website Redesign',
        assignedTo: '2',
        assignedToName: 'Selena Kyle',
        createdBy: '1',
        dueDate: '2024-12-15',
        createdAt: new Date().toISOString()
    },
    {
        _id: '2',
        title: 'Setup database',
        description: 'Configure MongoDB database',
        status: 'in_progress',
        priority: 'medium',
        project: '2',
        projectName: 'Mobile App',
        assignedTo: '4',
        assignedToName: 'Maria Garcia',
        createdBy: '2',
        dueDate: '2024-11-30',
        createdAt: new Date().toISOString()
    },
    {
        _id: '3',
        title: 'Write documentation',
        description: 'Document API endpoints',
        status: 'done',
        priority: 'low',
        project: '3',
        projectName: 'Marketing Campaign',
        assignedTo: '3',
        assignedToName: 'Alex Mason',
        createdBy: '1',
        dueDate: '2024-10-15',
        createdAt: new Date().toISOString()
    }
];

// Helper function to simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock axios instance
const mockApi = {
    // Request interceptor
    interceptors: {
        request: {
            use: (onFulfilled, onRejected) => {
                // Store callbacks for mock implementation
                mockApi._requestInterceptor = onFulfilled;
                mockApi._requestErrorInterceptor = onRejected;
            }
        },
        response: {
            use: (onFulfilled, onRejected) => {
                // Store callbacks for mock implementation
                mockApi._responseInterceptor = onFulfilled;
                mockApi._responseErrorInterceptor = onRejected;
            }
        }
    },

    // GET requests
    get: async (url, config) => {
        console.log('Mock API GET:', url);
        await delay(500); // Simulate network delay
        
        try {
            // Apply request interceptor if exists
            let requestConfig = config || {};
            if (mockApi._requestInterceptor) {
                requestConfig = mockApi._requestInterceptor(requestConfig) || requestConfig;
            }

            let responseData;

            // Handle different endpoints
            if (url === '/users') {
                responseData = mockUsers;
            }
            else if (url === '/users/all') {
                responseData = mockUsers;
            }
            else if (url.startsWith('/users/project/')) {
                const projectId = url.split('/').pop();
                const project = mockProjects.find(p => p._id === projectId);
                if (project) {
                    const memberIds = project.members.map(m => m.userId);
                    responseData = mockUsers.filter(user => memberIds.includes(user._id));
                } else {
                    responseData = [];
                }
            }
            else if (url === '/projects') {
                responseData = mockProjects;
            }
            else if (url === '/tasks/my-tasks') {
                // Return all tasks for mock (in real app, would filter by user)
                responseData = mockTasks;
            }
            else if (url.startsWith('/tasks/project/')) {
                const projectId = url.split('/').pop();
                responseData = mockTasks.filter(task => task.project === projectId);
            }
            else if (url.startsWith('/projects/')) {
                const projectId = url.split('/').pop();
                responseData = mockProjects.find(p => p._id === projectId) || null;
            }
            else if (url === '/health') {
                responseData = { status: 'OK', database: 'Mock MongoDB' };
            }
            else {
                responseData = [];
            }

            // Create response object
            const response = {
                data: responseData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: requestConfig
            };

            // Apply response interceptor if exists
            if (mockApi._responseInterceptor) {
                return mockApi._responseInterceptor(response);
            }

            return response;

        } catch (error) {
            // Apply error interceptor if exists
            if (mockApi._responseErrorInterceptor) {
                return mockApi._responseErrorInterceptor(error);
            }
            throw error;
        }
    },

    // POST requests
    post: async (url, data, config) => {
        console.log('Mock API POST:', url, data);
        await delay(600);
        
        try {
            let responseData;

            if (url === '/auth/login') {
                // Mock login - accept any credentials
                const mockUser = mockUsers[0]; // Return first user
                responseData = {
                    user: {
                        id: mockUser._id,
                        email: mockUser.email,
                        name: mockUser.name,
                        role: mockUser.role
                    },
                    token: 'mock-jwt-token-' + Date.now()
                };
            }
            else if (url === '/auth/register') {
                // Mock registration
                const newUser = {
                    _id: (mockUsers.length + 1).toString(),
                    name: data.name,
                    email: data.email,
                    role: 'member',
                    avatarColor: 'bg-gray-500'
                };
                mockUsers.push(newUser);
                
                responseData = {
                    user: {
                        id: newUser._id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role
                    },
                    token: 'mock-jwt-token-' + Date.now()
                };
            }
            else if (url === '/projects') {
                const newProject = {
                    _id: Date.now().toString(),
                    name: data.name,
                    description: data.description || 'New project description',
                    status: 'active',
                    createdBy: '1',
                    members: [
                        { userId: '1', role: 'admin' }
                    ],
                    createdAt: new Date().toISOString()
                };
                mockProjects.unshift(newProject);
                responseData = newProject;
            }
            else if (url === '/tasks') {
                const project = mockProjects.find(p => p._id === data.project);
                const assignedUser = mockUsers.find(u => u._id === data.assignedTo);
                
                const newTask = {
                    _id: Date.now().toString(),
                    title: data.title,
                    description: data.description || '',
                    status: 'todo',
                    priority: data.priority || 'medium',
                    project: data.project,
                    projectName: project?.name || 'Unknown Project',
                    assignedTo: data.assignedTo || null,
                    assignedToName: assignedUser?.name || null,
                    createdBy: '1',
                    dueDate: data.dueDate,
                    createdAt: new Date().toISOString()
                };
                mockTasks.unshift(newTask);
                responseData = newTask;
            }
            else if (url.includes('/projects/') && url.includes('/members')) {
                const projectId = url.split('/')[2];
                const project = mockProjects.find(p => p._id === projectId);
                if (project) {
                    project.members.push({
                        userId: data.userId,
                        role: data.role || 'member'
                    });
                    responseData = { success: true };
                } else {
                    throw new Error('Project not found');
                }
            }
            else {
                responseData = { success: true };
            }

            const response = {
                data: responseData,
                status: 201,
                statusText: 'Created',
                headers: {},
                config: config || {}
            };

            if (mockApi._responseInterceptor) {
                return mockApi._responseInterceptor(response);
            }

            return response;

        } catch (error) {
            if (mockApi._responseErrorInterceptor) {
                return mockApi._responseErrorInterceptor(error);
            }
            throw error;
        }
    },

    // PATCH requests
    patch: async (url, data, config) => {
        console.log('Mock API PATCH:', url, data);
        await delay(400);
        
        try {
            let responseData;

            if (url.includes('/tasks/') && url.includes('/status')) {
                const taskId = url.split('/')[2];
                const task = mockTasks.find(t => t._id === taskId);
                if (task) {
                    task.status = data.status;
                    responseData = task;
                } else {
                    throw new Error('Task not found');
                }
            }
            else {
                responseData = { success: true };
            }

            const response = {
                data: responseData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config || {}
            };

            if (mockApi._responseInterceptor) {
                return mockApi._responseInterceptor(response);
            }

            return response;

        } catch (error) {
            if (mockApi._responseErrorInterceptor) {
                return mockApi._responseErrorInterceptor(error);
            }
            throw error;
        }
    },

    // DELETE requests
    delete: async (url, config) => {
        console.log('Mock API DELETE:', url);
        await delay(400);
        
        try {
            if (url.startsWith('/projects/')) {
                const projectId = url.split('/').pop();
                mockProjects = mockProjects.filter(p => p._id !== projectId);
                // Also remove tasks for this project
                mockTasks = mockTasks.filter(t => t.project !== projectId);
            }
            else if (url.startsWith('/tasks/')) {
                const taskId = url.split('/').pop();
                mockTasks = mockTasks.filter(t => t._id !== taskId);
            }

            const response = {
                data: { success: true },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config || {}
            };

            if (mockApi._responseInterceptor) {
                return mockApi._responseInterceptor(response);
            }

            return response;

        } catch (error) {
            if (mockApi._responseErrorInterceptor) {
                return mockApi._responseErrorInterceptor(error);
            }
            throw error;
        }
    },

    // PUT requests (optional)
    put: async (url, data, config) => {
        console.log('Mock API PUT:', url, data);
        await delay(500);
        
        const response = {
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config || {}
        };

        return response;
    }
};

// Add default export
export default mockApi;