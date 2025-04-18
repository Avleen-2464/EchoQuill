// const cron = require('node-cron');
// const { exec } = require('child_process');
// const path = require('path');

// // Schedule journal generation to run at midnight every day
// cron.schedule('0 0 * * *', () => {
//     console.log('Running journal generation script...');
//     exec(`node ${path.join(__dirname, 'generateJournals.js')}`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing script: ${error}`);
//             return;
//         }
//         console.log(`Script output: ${stdout}`);
//         if (stderr) {
//             console.error(`Script errors: ${stderr}`);
//         }
//     });
// });

// console.log('Journal generation scheduler started. Will run at midnight every day.'); 