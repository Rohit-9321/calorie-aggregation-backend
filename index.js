const { MongoClient } = require("mongodb");

async function calculateCalories() {
  const uri = "mongodb://127.0.0.1:27017"; // Use IPv4 instead of localhost
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("fitness_db");
    const collection = db.collection("calorie_logs");

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    console.log("Filtering from:", fromDate.toISOString());

    const pipeline = [
      {
        $match: {
          date: {
            $gte: fromDate,
          },
        },
      },
      {
        $group: {
          _id: {
            athleteId: "$athleteId",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
          dailyCalories: { $sum: "$calories" },
        },
      },
      {
        $group: {
          _id: "$_id.athleteId",
          totalCalories: { $sum: "$dailyCalories" },
          averageCalories: { $avg: "$dailyCalories" },
        },
      },
      {
        $project: {
          _id: 0,
          athleteId: "$_id",
          totalCalories: 1,
          averageCalories: 1,
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();

    console.log("Athlete Calorie Stats for Last 7 Days:");
    if (results.length === 0) {
      console.log("No records found in the last 7 days.");
    }

    results.forEach((athlete) => {
      console.log(
        `Athlete: ${athlete.athleteId} | Total: ${athlete.totalCalories} | Average Daily: ${athlete.averageCalories.toFixed(2)}`
      );
    });
  } catch (error) {
    console.error("Error running aggregation:", error);
  } finally {
    await client.close();
  }
}

calculateCalories();
