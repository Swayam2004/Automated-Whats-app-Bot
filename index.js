const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  useMultiFileAuthState,
  makeInMemoryStore,
  getAggregateVotesInPollMessage,
} = require("@whiskeysockets/baileys");

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: true,
    auth: state,
  });

  const store = {};
  const getMessage = (key) => {
    const { id } = key;
    if (store[id]) return store[id].message;
  };

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });
  sock.ev.on("creds.update", saveCreds);

  const getText = (message) => {
    try {
      return (
        message.conversation ||
        message.extendedTextMessage.text ||
        message.extendedTextMessage.caption ||
        message.extendedTextMessage.contextInfo.quotedMessage.conversation ||
        message.extendedTextMessage.contextInfo.quotedMessage
          .extendedTextMessage.text ||
        message.extendedTextMessage.contextInfo.quotedMessage
          .extendedTextMessage.caption
      );
    } catch {
      return "";
    }
  };

  const sendMessage = async (jid, content, ...args) => {
    try {
      const sent = await sock.sendMessage(jid, content, ...args);
      store[sent.key.id] = sent;
    } catch (err) {
      console.log("Error sending message: ", err);
    }
  };

  const handMirror = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    const prefix = "!Mirror";
    if (!text.startsWith(prefix)) return;

    const reply = text.slice(prefix.length).trim();

    sendMessage(key.remoteJid, { text: reply }, { quoted: msg });
  };

  const handleAll = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("@all")) return;

    // 1. Get all group members
    const group = await sock.groupMetadata(key.remoteJid);

    // 2. Tag them and reply
    const members = group.participants;

    const mentions = [];
    const items = [];

    members.forEach(({ id, admin }) => {
      mentions.push(id);
      items.push(`@${id.replace("@s.whatsapp.net", "")}`);

      console.log("id", id);
      console.log("admin", admin);
      console.log("items", items);
    });

    sendMessage(
      key.remoteJid,
      { text: items.join(" "), mentions },
      { quoted: msg }
    );
  };

  const timer = (ms) => new Promise((res) => setTimeout(res, ms));

  const giveMessageToAll = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("@hellooo bacchooo")) return;

    // 1. Get all group members
    const group = await sock.groupMetadata(key.remoteJid);

    // 2. Tag them and reply
    const members = group.participants;

    const mentions = [];
    const items = [];
    const personalId = [];

    members.forEach(({ id, admin }) => {
      mentions.push(id);
      personalId.push(id);
      items.push(`@${id.replace("@s.whatsapp.net", "")}`);

      console.log("id", id);
      console.log("admin", admin);
      console.log("items", items);
    });

    items.forEach((item) => {
      console.log("item: ", item);
    });

    for (let i = 0; i < personalId.length; i++) {
      console.log("item: ", personalId[i]);

      sendMessage(personalId[i], {
        text: "Hi 👋",
      });

      await timer(100);

      sendMessage(personalId[i], {
        text: "Nice to meet you 😃",
      });

      await timer(100);

      sendMessage(personalId[i], {
        text: "This is Swayam Subhankar Sahoo, from IT branch, recently shifted in CSE branch",
      });

      await timer(100);

      sendMessage(personalId[i], {
        text: "Can you please share your full name (if you don't mind), so that I can remember you easily and connect with you in the class 😊",
      });

      await timer(100);

      sendMessage(personalId[i], {
        text: "P.S. - These messages are made using a WhatsApp bot that I made, and are given to everyone in the CSE group 😅",
      });

      await timer(1000);
    }

    // personalId.forEach((id) => {
    //   console.log("item: ", id);

    //   sendMessage(id, {
    //     text: "Hi 👋\nNice to meet you 😃\nThis is Swayam Subhankar Sahoo, from IT branch, recently shifted in CSE branch\nCan you please share your full name (if you don't mind), so that I can remember you easily and connect with you in the class 😊\nP.S. - These messages are made using a WhatsApp bot that I made, and are given to everyone in the CSE group 😅",
    //   });

    //   // await timer(1000);

    //   // sendMessage(id, {
    //   //   text: "Nice to meet you 😃",
    //   // });

    //   // sendMessage(id, {
    //   //   text: "This is Swayam Subhankar Sahoo, from IT branch, recently shifted in CSE branch",
    //   // });

    //   // sendMessage(id, {
    //   //   text: "Can you please share your full name (if you don't mind), so that I can remember you easily and connect with you in the class 😊",
    //   // });

    //   // sendMessage(id, {
    //   //   text: "P.S. - These messages are made using a WhatsApp bot that I made, and are given to everyone in the CSE group 😅",
    //   // });
    // });

    // sendMessage(
    //   key.remoteJid,
    //   { text: items.join(" "), mentions },
    //   { quoted: msg }
    // );
  };

  const sendReactionMessage = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("congrats")) return;

    const reactionMessage = {
      react: {
        text: "🥳", // use an empty string to remove the reaction
        key: msg.key,
      },
    };

    const sendMsg = await sock.sendMessage(key.remoteJid, reactionMessage);
  };

  const sendCongratsReactionMessage = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("good bot")) return;

    const reactionMessage = {
      react: {
        text: "💖", // use an empty string to remove the reaction
        key: msg.key,
      },
    };

    const sendMsg = await sock.sendMessage(key.remoteJid, reactionMessage);
  };

  const sendCurseReactionMessage = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("bad bot")) return;

    const reactionMessage = {
      react: {
        text: "🤬", // use an empty string to remove the reaction
        key: msg.key,
      },
    };

    const sendMsg = await sock.sendMessage(key.remoteJid, reactionMessage);
  };

  const createPoll = async (msg) => {
    const { key, message } = msg;

    const text = getText(message);

    if (!text) return;

    if (!text.toLowerCase().includes("!poll")) return;

    const pollMessage = {
      poll: {
        name: "Your Poll Question",
        values: ["Option 1", "Option 2", "Option 3"],
        selectableCount: 1,
      },
    };

    await sock.sendMessage(key.remoteJid, pollMessage, { quoted: msg });

    // await sock.sendMessage(
    //   key.remoteJid,
    //   { text: "This is working, right? (Poll with single choice)" },
    //   { quoted: msg }
    // );
  };

  const checkForPollUpdates = async (msg) => {
    const { key, message } = msg;

    if (msg.message?.pollUpdateMessage) {
      const pollUpdate = msg.message.pollUpdateMessage;
      extractPollResults(pollUpdate);
      await sock.sendMessage(key.remoteJid, { text: "Poll Updated" });
      console.log("Poll Update:", pollUpdate);
    }
  };

  function extractPollResults(pollUpdate) {
    if (pollUpdate.pollResults) {
      const pollResults = pollUpdate.pollResults;
      pollResults.forEach((result) => {
        console.log(`Option: ${result.optionName}, Votes: ${result.votes}`);
      });
    } else {
      console.log("No poll results found in the update.");
    }
  }

  sock.ev.process((events) => {
    if (events["messages.upsert"]) {
      const { messages } = events["messages.upsert"];

      messages.forEach((msg) => {
        if (!msg.message) return;

        handMirror(msg);
        handleAll(msg);
        giveMessageToAll(msg);
        sendReactionMessage(msg);
        sendCongratsReactionMessage(msg);
        sendCurseReactionMessage(msg);
        createPoll(msg);
        // checkForPollUpdates(msg);
        console.log(msg);

        if (msg.message.pollUpdateMessage) {
          console.log(msg.message.pollUpdateMessage.vote);
        }
      });
    }
  });

  //   sock.ev.process(
  //     // events is a map for event name => event data
  //     async(events) => {
  //         // something about the connection changed
  //         // maybe it closed, or we received all offline message or connection opened
  //         if(events['connection.update']) {
  //             const update = events['connection.update']
  //             const { connection, lastDisconnect } = update
  //             if(connection === 'close') {
  //                 // reconnect if not logged out
  //                 if((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
  //                     startSock()
  //                 } else {
  //                     // console.log('Connection closed. You are logged out.')
  //                 }
  //             }

  //             // WARNING: THIS WILL SEND A WAM EXAMPLE AND THIS IS A ****CAPTURED MESSAGE.****
  //             // DO NOT ACTUALLY ENABLE THIS UNLESS YOU MODIFIED THE FILE.JSON!!!!!
  //             // THE ANALYTICS IN THE FILE ARE OLD. DO NOT USE THEM.
  //             // YOUR APP SHOULD HAVE GLOBALS AND ANALYTICS ACCURATE TO TIME, DATE AND THE SESSION
  //             // THIS FILE.JSON APPROACH IS JUST AN APPROACH I USED, BE FREE TO DO THIS IN ANOTHER WAY.
  //             // THE FIRST EVENT CONTAINS THE CONSTANT GLOBALS, EXCEPT THE seqenceNumber(in the event) and commitTime
  //             // THIS INCLUDES STUFF LIKE ocVersion WHICH IS CRUCIAL FOR THE PREVENTION OF THE WARNING
  //             const sendWAMExample = false;
  //             if(connection === 'open' && sendWAMExample) {
  //                 /// sending WAM EXAMPLE
  //                 const {
  //                     header: {
  //                         wamVersion,
  //                         eventSequenceNumber,
  //                     },
  //                     events,
  //                 } = JSON.parse(await fs.promises.readFile("./boot_analytics_test.json", "utf-8"))

  //                 const binaryInfo = new BinaryInfo({
  //                     protocolVersion: wamVersion,
  //                     sequence: eventSequenceNumber,
  //                     events: events
  //                 })

  //                 const buffer = encodeWAM(binaryInfo);

  //                 const result = await sock.sendWAMBuffer(buffer)
  //                 // console.log(result)
  //             }

  //             // console.log('connection update', update)
  //         }

  //         // credentials updated -- save them
  //         if(events['creds.update']) {
  //             await saveCreds()
  //         }

  //         if(events['labels.association']) {
  //             // console.log(events['labels.association'])
  //         }

  //         if(events['labels.edit']) {
  //             // console.log(events['labels.edit'])
  //         }

  //         if(events.call) {
  //             // console.log('recv call event', events.call)
  //         }

  //         // history received
  //         if(events['messaging-history.set']) {
  //             const { chats, contacts, messages, isLatest } = events['messaging-history.set']
  //             // console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`)
  //         }

  //         // received a new message
  //         if(events['messages.upsert']) {
  //             const upsert = events['messages.upsert']
  //             // console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

  //             if(upsert.type === 'notify') {
  //                 for(const msg of upsert.messages) {
  //                     if(!msg.key.fromMe && doReplies) {
  //                         // console.log('replying to', msg.key.remoteJid)
  //                         await sock.readMessages([msg.key])
  //                         await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid)
  //                     }
  //                 }
  //             }
  //         }

  //         // messages updated like status delivered, message deleted etc.
  //         if(events['messages.update']) {
  //             // console.log(
  //             //     JSON.stringify(events['messages.update'], undefined, 2)
  //             // )

  //             for(const { key, update } of events['messages.update']) {
  //                 if(update.pollUpdates) {
  //                     const pollCreation = await getMessage(key)
  //                     if(pollCreation) {
  //                         console.log(
  //                             'got poll update, aggregation: ',
  //                             getAggregateVotesInPollMessage({
  //                                 message: pollCreation,
  //                                 pollUpdates: update.pollUpdates,
  //                             })
  //                         )
  //                     }
  //                 }
  //             }
  //         }

  //         if(events['message-receipt.update']) {
  //             // console.log(events['message-receipt.update'])
  //         }

  //         if(events['messages.reaction']) {
  //             // console.log(events['messages.reaction'])
  //         }

  //         if(events['presence.update']) {
  //             // console.log(events['presence.update'])
  //         }

  //         if(events['chats.update']) {
  //             // console.log(events['chats.update'])
  //         }

  //         if(events['contacts.update']) {
  //             for(const contact of events['contacts.update']) {
  //                 if(typeof contact.imgUrl !== 'undefined') {
  //                     const newUrl = contact.imgUrl === null
  //                         ? null
  //                         : await sock.profilePictureUrl(contact.id).catch(() => null)
  //                     // console.log(
  //                     //     `contact ${contact.id} has a new profile pic: ${newUrl}`,
  //                     // )
  //                 }
  //             }
  //         }

  //         if(events['chats.delete']) {
  //             // console.log('chats deleted ', events['chats.delete'])
  //         }
  //     }
  // )
}

// run in main file
connectToWhatsApp();
