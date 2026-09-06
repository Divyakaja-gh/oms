fetch('http://localhost:3000/api/audit-logs/security-incidents', {
  headers: { 'Authorization': 'Bearer mocked-soc2-jwt-token' }
}).then(res => res.text()).then(text => console.log(text.substring(0, 100))).catch(console.error);
