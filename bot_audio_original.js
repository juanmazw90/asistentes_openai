/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;
const openai_token = process.env.OPENAI_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()), // creates express http server
  FormData = require("form-data");

const transcript_audio = async (media_id) => {
  try {
    const media = await axios({
      method: "GET",
      url:
        "https://graph.facebook.com/v17.0/" +
        media_id +
        "?access_token=" +
        token,
    });

    const file = await axios({
      method: "GET", // Required, HTTP method, a string, e.g. POST, GET
      url: media.data.url,
      responseType: "arraybuffer",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const buffer = Buffer.from(file.data);

    // Create a FormData object
    let formData = new FormData();
    formData.append("file", buffer, {
      filename: "grabacion.ogg",
      contentType: "audio/ogg",
    });
    formData.append("model", "whisper-1");

    // Make the request
    const openai_transcription = await axios({
      method: "post",
      url: "https://api.openai.com/v1/audio/transcriptions",
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_TOKEN,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      data: formData,
    });

    return openai_transcription.data.text;
  } catch (error) {
    console.error(error);
    throw error; // If you want the error to propagate
  }
};

const chatgpt_completion = async (message) => {
  try {
    let openai_data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu eres un asistente muy útil.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const completion = await axios({
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_TOKEN,
      },
      data: openai_data,
    });

    return completion.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw error; // If you want the error to propagate
  }
};

const send_message = async (phone_number_id, to, text) => {
  try {
    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url:
        "https://graph.facebook.com/v12.0/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text },
      },
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    throw error; // If you want the error to propagate
  }
};

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let message_type = req.body.entry[0].changes[0].value.messages[0].type;

      if (message_type === "text") {
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

        const chatgpt_response = await chatgpt_completion(msg_body);
        await send_message(phone_number_id, from, chatgpt_response);
      } else if (message_type === "audio") {
        await send_message(
          phone_number_id,
          from,
          "Procesando nota de voz. Espera..."
        );
        let transcription_response = await transcript_audio(
          req.body.entry[0].changes[0].value.messages[0].audio.id
        );
        const transcription =
          '*Transcripción del audio:*\n\n"' +
          transcription_response +
          '"\n\n_Estamos procesando tu mensaje con ChatGPT, tardará unos segundos..._';
        await send_message(phone_number_id, from, transcription);
        const chatgpt_response = await chatgpt_completion(
          transcription_response
        );
        await send_message(phone_number_id, from, chatgpt_response);
      }
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});