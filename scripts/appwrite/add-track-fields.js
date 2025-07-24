const { Client, Databases, Permission, Role } = require("node-appwrite");

// Конфигурация Appwrite
const APPWRITE_CONFIG = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_URL || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_ENDPOINT || "67f223590032b871e5f6",
  databaseId: process.env.NEXT_PUBLIC_DATABASE_ID || "67f225f50010cced7742",
  trackCollectionId:
    process.env.NEXT_PUBLIC_COLLECTION_ID_POST || "67f22813001f125cc1e5",
};

async function addTrackFields() {
  console.log("🚀 Starting Appwrite track fields addition...");

  // Проверяем наличие API ключа
  if (!process.env.APPWRITE_API_KEY) {
    console.error("❌ APPWRITE_API_KEY environment variable is required");
    console.log("Please set your Appwrite API key:");
    console.log(
      'export APPWRITE_API_KEY="standard_e9106b6b74d20b8ccdadc8e4254b34b29e7a800ce7d404c47ce20741dc4214063b7b65f0d979e66ca5d3924f29562bdda36d9629b76c32e68f7162387eedf13aed10b9f12df477e605a0ff094e5101d69e82ac50dc06121904ea2a20f067256b2715c41225dcc0ba336fae997e05c3b16786b7ea81b0f277f1e25a69d0b13633"',
    );
    process.exit(1);
  }

  // Инициализируем клиент
  const client = new Client();
  client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  console.log("📊 Configuration:");
  console.log(`- Endpoint: ${APPWRITE_CONFIG.endpoint}`);
  console.log(`- Project ID: ${APPWRITE_CONFIG.projectId}`);
  console.log(`- Database ID: ${APPWRITE_CONFIG.databaseId}`);
  console.log(`- Collection ID: ${APPWRITE_CONFIG.trackCollectionId}`);

  try {
    // Проверяем существование коллекции
    console.log("\n🔍 Checking collection existence...");
    const collection = await databases.getCollection(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.trackCollectionId,
    );
    console.log(`✅ Collection "${collection.name}" found`);

    // Определяем поля для добавления
    const fieldsToAdd = [
      {
        key: "likes_count",
        type: "integer",
        label: "Likes Count",
        required: false,
        default: 0,
      },
      {
        key: "plays_count",
        type: "integer",
        label: "Plays Count",
        required: false,
        default: 0,
      },
      {
        key: "shares_count",
        type: "integer",
        label: "Shares Count",
        required: false,
        default: 0,
      },
      {
        key: "duration",
        type: "string",
        label: "Track Duration",
        required: false,
        default: "PT3M",
      },
    ];

    console.log("\n📝 Adding fields to collection...");

    for (const field of fieldsToAdd) {
      try {
        console.log(`\n➕ Adding field "${field.key}" (${field.type})...`);

        if (field.type === "integer") {
          await databases.createIntegerAttribute(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.trackCollectionId,
            field.key,
            field.required,
            0, // min value
            999999, // max value
            field.default,
          );
        } else if (field.type === "string") {
          await databases.createStringAttribute(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.trackCollectionId,
            field.key,
            255, // size
            field.required,
            field.default,
          );
        }

        console.log(`✅ Field "${field.key}" added successfully`);

        // Небольшая задержка между запросами
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`⚠️  Field "${field.key}" already exists, skipping...`);
        } else {
          console.error(`❌ Error adding field "${field.key}":`, error.message);
        }
      }
    }

    console.log("\n🎉 Track fields addition completed!");
    console.log("\n📋 Summary:");
    console.log("- likes_count: Integer field for tracking likes");
    console.log("- plays_count: Integer field for tracking plays");
    console.log("- shares_count: Integer field for tracking shares");
    console.log("- duration: String field for track duration in ISO format");

    console.log(
      "\n🔄 You may need to update existing documents to include default values.",
    );
    console.log(
      "Run the update script if needed: npm run update-track-defaults",
    );
  } catch (error) {
    console.error("\n❌ Error during field addition:", error.message);

    if (
      error.message.includes(
        "Collection with the requested ID could not be found",
      )
    ) {
      console.log("\n💡 Suggestions:");
      console.log("1. Check that the collection ID is correct");
      console.log("2. Verify that the database ID is correct");
      console.log("3. Make sure your API key has the correct permissions");
    } else if (error.message.includes("Missing or invalid API key")) {
      console.log("\n💡 API Key issue:");
      console.log("1. Check that APPWRITE_API_KEY is set correctly");
      console.log("2. Verify the API key has database permissions");
      console.log("3. Make sure the API key is not expired");
    }

    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  addTrackFields().catch(console.error);
}

module.exports = { addTrackFields };
