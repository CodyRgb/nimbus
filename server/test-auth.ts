import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const testAuth = async () => {
    try {
        // 1. Register
        console.log('Testing Register...');
        const registerRes = await axios.post(`${API_URL}/register`, {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
        });
        console.log('Register Success:', registerRes.data);

        const { email, token } = registerRes.data;

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email,
            password: 'password123',
        });
        console.log('Login Success:', loginRes.data);

        // 3. Logout
        console.log('\nTesting Logout...');
        const logoutRes = await axios.post(`${API_URL}/logout`);
        console.log('Logout Success:', logoutRes.data);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error:', error.response?.data || error.message);
        } else {
            console.error('Error:', error);
        }
    }
};

testAuth();
