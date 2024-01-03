// Create service client module using ES6 syntax.
import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
// Set the AWS Region.
const REGION = process.env.REACT_APP_S3_REGION;
// Create an Amazon S3 service client object.
var creds = {accessKeyId: process.env.REACT_APP_accessKeyId_pic,
    secretAccessKey: process.env.REACT_APP_secretAccessKey_pic}
const s3_config = { region: REGION, credentials: creds}
const s3Client = new S3Client(s3_config);
var s3 = undefined;

console.log(s3_config);

console.log(s3Client);
// console.log(s3Client.doesBucketExist(process.env.REACT_APP_S3_BUCKET));


export const uploadPic = async (file, newFileName, folder) => {
    try {
        if (folder === "poster") {
            var bucketParams = {
                Bucket: "nft-event-images",
                Key: "poster/"+newFileName,
                Body: file,
            };
            const data = await s3Client.send(new PutObjectCommand(bucketParams));
            console.log(
            "Successfully uploaded object: " +
                bucketParams.Bucket +
                "/" +
                bucketParams.Key
            );
        } else {
            var bucketParams = {
                Bucket: "nft-event-images",
                Key: "seat/"+newFileName,
                Body: file,
            };
            const data = await s3Client.send(new PutObjectCommand(bucketParams));
            console.log(
            "Successfully uploaded object: " +
                bucketParams.Bucket +
                "/" +
                bucketParams.Key
            );
        }
      } catch (err) {
        console.log("Error", err);
      }
}

export const deletePic = async (newFileName, folder) => {
    try {
        if (folder === "poster") {
            var bucketParams = {
                Bucket: "nft-event-images",
                Key: "poster/"+newFileName
            };
            const data = await s3Client.send(new DeleteObjectCommand(bucketParams));
            console.log(
            "Successfully deleted object: " +
                bucketParams.Bucket +
                "/" +
                bucketParams.Key
            );
        } else {
            var bucketParams = {
                Bucket: "nft-event-images",
                Key: "seat/"+newFileName
            };
            const data = await s3Client.send(new DeleteObjectCommand(bucketParams));
            console.log(
            "Successfully deleted object: " +
                bucketParams.Bucket +
                "/" +
                bucketParams.Key
            );
        }
      } catch (err) {
        console.log("Error", err);
      }
}
