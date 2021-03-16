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
    await saveFile('results.json', JSON.stringify(await ylt(url, {...options, saveFile})));
    return {status: 'processed', id, bucket, keyPrefix};
}

module.exports = {runner}