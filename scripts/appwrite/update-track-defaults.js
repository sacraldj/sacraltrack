const { Client, Databases, Query } = require("node-appwrite");

// Конфигурация Appwrite
const APPWRITE_CONFIG = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_URL || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_ENDPOINT || "67f223590032b871e5f6",
  databaseId: process.env.NEXT_PUBLIC_DATABASE_ID || "67f225f50010cced7742",
  trackCollectionId:
    process.env.NEXT_PUBLIC_COLLECTION_ID_POST || "67f22813001f125cc1e5",
};

async function updateTrackDefaults() {
  console.log("🚀 Starting Appwrite track defaults update...");

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

    // Получаем все документы
    console.log("\n📄 Fetching all track documents...");
    let allDocuments = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.trackCollectionId,
        [Query.limit(limit), Query.offset(offset)],
      );

      allDocuments = allDocuments.concat(response.documents);
      hasMore = response.documents.length === limit;
      offset += limit;

      console.log(
        `📥 Fetched ${response.documents.length} documents (total: ${allDocuments.length})`,
      );
    }

    console.log(`\n📊 Total documents found: ${allDocuments.length}`);

    if (allDocuments.length === 0) {
      console.log("ℹ️  No documents to update");
      return;
    }

    // Определяем дефолтные значения
    const defaultValues = {
      likes_count: 0,
      plays_count: 0,
      shares_count: 0,
    };

    console.log("\n🔄 Updating documents with default values...");
    console.log("Default values:", defaultValues);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allDocuments.length; i++) {
      const doc = allDocuments[i];
      const progress = `[${i + 1}/${allDocuments.length}]`;

      try {
        // Проверяем, какие поля нужно добавить
        const updateData = {};
        let needsUpdate = false;

        for (const [key, defaultValue] of Object.entries(defaultValues)) {
          if (!(key in doc) || doc[key] === null || doc[key] === undefined) {
            updateData[key] = defaultValue;
            needsUpdate = true;
          }
        }

        if (!needsUpdate) {
          console.log(
            `${progress} ⏭️  Document ${doc.$id} already has all fields, skipping...`,
          );
          skippedCount++;
          continue;
        }

        console.log(`${progress} 📝 Updating document ${doc.$id}...`);
        console.log(`   Adding fields: ${Object.keys(updateData).join(", ")}`);

        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.trackCollectionId,
          doc.$id,
          updateData,
        );

        console.log(`${progress} ✅ Document ${doc.$id} updated successfully`);
        updatedCount++;

        // Небольшая задержка между запросами чтобы не перегружать API
        if (i % 10 === 0 && i > 0) {
          console.log(`   💤 Pausing for rate limiting...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `${progress} ❌ Error updating document ${doc.$id}:`,
          error.message,
        );
        errorCount++;

        // Если много ошибок подряд, останавливаемся
        if (errorCount > 5) {
          console.error("\n🛑 Too many errors, stopping update process");
          break;
        }
      }
    }

    console.log("\n🎉 Update process completed!");
    console.log("\n📊 Summary:");
    console.log(`- Total documents: ${allDocuments.length}`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped (already had fields): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log(
        "\n⚠️  Some documents failed to update. Please check the error messages above.",
      );
    }

    if (updatedCount > 0) {
      console.log("\n✨ Track defaults have been successfully applied!");
      console.log("All tracks now have:");
      console.log("- likes_count: 0 (default)");
      console.log("- plays_count: 0 (default)");
      console.log("- shares_count: 0 (default)");
    }
  } catch (error) {
    console.error("\n❌ Error during update process:", error.message);

    if (
      error.message.includes(
        "Collection with the requested ID could not be found",
      )
    ) {
      console.log("\n💡 Suggestions:");
      console.log("1. Check that the collection ID is correct");
      console.log("2. Verify that the database ID is correct");
      console.log("3. Make sure your API key has the correct permissions");
      console.log("4. Run the add-track-fields script first if you haven't");
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
  updateTrackDefaults().catch(console.error);
}

module.exports = { updateTrackDefaults };
