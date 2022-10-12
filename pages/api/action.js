import axios from "axios";

const { TELEGRAM_BOT_KEY, TELEGRAM_GROUP_ID, RECORD_ACTIONS } = process.env;
const TELEGRAM_API_SEND_MSG_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_KEY}/sendMessage`;

export default function handler(req, res) {
  if (RECORD_ACTIONS !== "true") {
    res.status(200).json({});
    return;
  }
  const { message } = req.body;
  axios.post(TELEGRAM_API_SEND_MSG_URL, {
    chat_id: TELEGRAM_GROUP_ID,
    text: message,
  });
  res.status(200).json({});
}
