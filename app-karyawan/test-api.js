import { generateEmployeeTokens } from './server/lib/employeeSession.js';

async function testApi() {
  const { accessToken } = generateEmployeeTokens({ id: 14 });
  
  try {
    const res = await fetch('http://localhost:4000/api/employee-me/notifications', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const status = res.status;
    const contentType = res.headers.get('content-type');
    const text = await res.text();
    
    console.log("Status:", status);
    console.log("Content-Type:", contentType);
    console.log("Body:", text);
    
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testApi();
