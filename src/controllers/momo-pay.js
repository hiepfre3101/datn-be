import dotenv from "dotenv";
import { createHmac } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import https from "https";
dotenv.config();

const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_CODE;
const secretKey = process.env.MOMO_SECRET_KEY;
const requestId = uuidv4().split("-").join("").toString();
const redirectUrl = process.env.RETURN_URL;
const ipnUrl = process.env.NOTIFY_URL;
const requestType = "captureWallet";
const orderId = uuidv4();
//tao signature
const createSignature = (amount, orderId, extraData) => {
  const rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;
  const signature = createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  console.log(3, rawSignature);
  return signature;
};

// tao request
export const handleTransaction = ({ amount, extraData }) => {
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    accessKey: accessKey,
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    extraData: extraData,
    requestType: requestType,
    signature: createSignature(amount, orderId, extraData),
    lang: "en",
  });
  console.log(4, requestBody);
  const options = {
    hostname: process.env.MOMO_DOMAIN,
    path: "/v2/gateway/api/create",
    method: "post",
    port: 443,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };
  return new Promise((resolve, rejects) => {
    const req = https.request(options, (res) => {
      let responseBody = {};
      res.setEncoding("utf8");
      res.on("data", (body) => {
        responseBody = body;
      });
      res.on("end", () => {
        resolve(JSON.stringify(responseBody));
      });
    });

    req.on("error", (e) => {
      rejects(e.message);
    });
    req.write(requestBody);
    req.end();
  });
};

export const handleResponseFromTransaction = async (req, res) => {
  console.log(req.body);
};
