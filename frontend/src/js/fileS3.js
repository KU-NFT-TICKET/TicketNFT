// Create service client module using ES6 syntax.
import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
// Set the AWS Region.
const REGION = "ap-northeast-1";
// Create an Amazon S3 service client object.
var creds = {accessKeyId: process.env.REACT_APP_accessKeyId_pic,
    secretAccessKey: process.env.REACT_APP_secretAccessKey_pic}
const s3Client = new S3Client({ region: REGION, credentials: creds});

export const uploadPic = async (file, newFileName, folder) => {
    try {
        if (folder === "poster") {
            var bucketParams = {
                Bucket: "nft-event-picture",
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
                Bucket: "nft-event-picture",
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
                Bucket: "nft-event-picture",
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
                Bucket: "nft-event-picture",
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
