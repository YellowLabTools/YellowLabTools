const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ylt = require('..');

// noinspection JSUnusedLocalSymbols
async function runner({id, url, options = {}}, context) {
    console.log(`Processing run #${id} on ${url}`);
    
    const bucket = process.env.RESULT_BUCKET_NAME;
    const keyPrefix = `results/${id}`;

    const saveFile = async (path, content) => s3.putObject({Bucket: bucket, Key: `${keyPrefix}/${path}`, Body: content})
        .promise();
    
    const results = JSON.stringify(await ylt(url, {...options, saveFile}));
    results.runId = id;
    
    await saveFile('results.json', results);
    
    return {status: 'processed', id, bucket, keyPrefix};
}

module.exports = {runner}