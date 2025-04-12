this is a guide for changing the spotify "now playing" card to "see what I'm currently doing" card via discord status that can be retrieved using lanyard as below example, after we retrieve the json status (example below) we can then use that json to make a card (beautifuly with some animation etc) that display what we are currently doing.

my user Id is: 877018055815868426


Usage
Using without websocket:

import { useLanyard } from "react-use-lanyard";

function App() {
	const lanyard = useLanyard({
		userId: "952574663916154960",
	});

	return (
		<pre>{!lanyard.isValidating && JSON.stringify(lanyard, null, 4)}</pre>
	);
}

export default App;
Using with websocket:

import { useLanyard } from "react-use-lanyard";

function App() {
	const { loading, status /*, websocket */ } = useLanyard({
		userId: "952574663916154960",
		socket: true,
	});

	return <pre>{!loading && JSON.stringify(status, null, 4)}</pre>;
}

export default App;
🔐 KV Support
You can create/delete KV pairs using this package.

import { set, del } from "react-use-lanyard";

// Set KV pair
await set({
	apiKey: "your_api_key", // get it using .apikey command on lanyard bot
	userId: "your_user_id",
	key: "test_key",
	value: "test value",
	// apiUrl: "lanyard.338.rocks", // if you are using self-hosted api, not required by default
});

// Delete KV pair
await del({
	apiKey: "your_api_key",
	userId: "your_user_id",
	key: "test_key",
	// apiUrl: "lanyard.338.rocks", // if you are using self-hosted api, not required by default
});

example json response:
{
  "data": {
    "kv": {

    },
    "discord_user": {
      "id": "877018055815868426",
      "username": "abynab",
      "avatar": "a_6e2d48748cb9c5faddd71f4e29450172",
      "discriminator": "0",
      "clan": null,
      "avatar_decoration_data": null,
      "bot": false,
      "global_name": null,
      "primary_guild": null,
      "display_name": null,
      "public_flags": 128,
      "collectibles": null
    },
    "activities": [
      {
        "id": "custom",
        "name": "Custom Status",
        "type": 4,
        "emoji": {
          "id": "1114500435265458176",
          "name": "BlushCry",
          "animated": false
        },
        "created_at": 1744417034965
      },
      {
        "flags": 0,
        "id": "6d675949a174d292",
        "name": "GitHub Codespaces",
        "type": 0,
        "state": "Workspace: abyndotxyz",
        "details": "Editing lanyard-guide.md",
        "application_id": "778572824708775946",
        "timestamps": {
          "start": 1744419369191000
        },
        "assets": {
          "large_image": "mp:external/v-dTd7VMbVH13Jrg2RS_QfbQZ-h6kfONjoQA5sfWq3U/https/cdn.rcd.gg/PreMiD/websites/G/GitHub%2520Codespaces/assets/79.png",
          "large_text": "PreMiD • v2.7.4",
          "small_image": "mp:external/gaSlgbOGBqbOTvXpkAvoKXixm7Z7VuwPuj4yGA7yFlY/https/cdn.rcd.gg/PreMiD/websites/G/GitHub%2520Codespaces/assets/131.png",
          "small_text": "GitHub Codespaces"
        },
        "created_at": 1744419370217,
        "platform": "desktop"
      },
      {
        "flags": 48,
        "id": "spotify:1",
        "name": "Spotify",
        "type": 2,
        "state": "Cult Member; Mia Martina",
        "session_id": "2ca23f73c1bb91abb0cc95e7a21e8d1e",
        "details": "U Weren't Here I Really Miss You - slowed",
        "timestamps": {
          "start": 1744419407133,
          "end": 1744419595597
        },
        "assets": {
          "large_image": "spotify:ab67616d0000b2734e85d09d7a1cbf8fb5aa5cf0",
          "large_text": "U Weren't Here I Really Miss You (slowed)"
        },
        "sync_id": "0gCkIC8Zo808SZ1BzYIGwV",
        "created_at": 1744419408251,
        "party": {
          "id": "spotify:877018055815868426"
        }
      }
    ],
    "discord_status": "dnd",
    "active_on_discord_web": true,
    "active_on_discord_desktop": false,
    "active_on_discord_mobile": true,
    "listening_to_spotify": true,
    "spotify": {
      "timestamps": {
        "start": 1744419407133,
        "end": 1744419595597
      },
      "album": "U Weren't Here I Really Miss You (slowed)",
      "album_art_url": "https://i.scdn.co/image/ab67616d0000b2734e85d09d7a1cbf8fb5aa5cf0",
      "artist": "Cult Member; Mia Martina",
      "song": "U Weren't Here I Really Miss You - slowed",
      "track_id": "0gCkIC8Zo808SZ1BzYIGwV"
    }
  },
  "success": true
}