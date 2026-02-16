const https = require('https');

function fetchRepoData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const responseData = JSON.parse(data);
                    const repoName = responseData.name;
                    console.log('Repository Name:', repoName);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    try {
        await fetchRepoData('https://api.github.com/repos/cohereai/command-r');
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

main();