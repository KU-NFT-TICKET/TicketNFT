var AWS = require("aws-sdk");
let awsConfig = {
    "region": "ap-northeast-1",
    "endpoint": "http://dynamodb.ap-northeast-1.amazonaws.com",
    "accessKeyId": process.env.REACT_APP_accessKeyId, "secretAccessKey": process.env.REACT_APP_secretAccessKey
};
AWS.config.update(awsConfig);

const docClient = new AWS.DynamoDB.DocumentClient()

export const scanData = async (tableName, key, select) => {
    var params = {
        TableName: tableName
    }
    if (key !== '') {
        params = {
            TableName: tableName,
            Key: key
        }
    } else if (select !== '') {
        params = {
            TableName: tableName,
            Select: select
        }
    }
    try {
        const data = await docClient.scan(params).promise()
        return data
    } catch (err) {
        console.log("Failure", err.message)
        // there is no data here, you can return undefined or similar
    }
}

export const getData = async (tableName, key) => {
    var params = {
        TableName: tableName,
        Key: key
    }
    try {
        const data = await docClient.get(params).promise()
        return data
    } catch (err) {
        console.log("Failure", err.message)
        // there is no data here, you can return undefined or similar
    }
}

export const queryData = async (params) => {
    // var params = {
    //     TableName: tableName,
    // }
    console.log(params);
    try {
        const data = await docClient.query(params).promise()
        console.log(data);
        return data
    } catch (err) {
        console.log("Failure", err.message)
        // there is no data here, you can return undefined or similar
    }
}

export const putData = async (tableName , data) => {
    var params = {
        TableName: tableName,
        Item: data
    }
    
    // docClient.put(params, function (err, data) {
    //     if (err) {
    //         console.log('Error', err)
    //     } else {
    //         console.log('Success', data)
    //     }
    // })
    try {
        const data = await docClient.put(params).promise()
        return data
    } catch (err) {
        console.log("Failure", err.message)
        // there is no data here, you can return undefined or similar
    }
}