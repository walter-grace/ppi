/**
 * Quick script to check if server is running
 */

async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    console.log('✅ Server is running on port 3000!');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    try {
      const response = await fetch('http://localhost:3001');
      console.log('⚠️  Server is running on port 3001 (not 3000)');
      console.log(`   Status: ${response.status}`);
      return false;
    } catch {
      console.log('❌ Server is not running on port 3000 or 3001');
      console.log('   Please run: npm run dev');
      return false;
    }
  }
}

checkServer();

