package com.technicallyfit

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

// Data class for user config (add more fields as needed)
data class UserConfig(
    val version: String?,
    val defaultDeload: Int?,
    val deloadOptions: List<Int>?,
    val maxRestTimeSec: Int?,
    val weightIncrementLbs: Double?,
    val autoPurgeDays: Int?,
    val summarizeOn: String?,
    val maxMonthlySummaries: Int?,
    val maxYearlySummaries: Int?,
    val smartSetNudges: Boolean?,
    val dynamicDeload: Boolean?,
    val cycleLengthWeeks: Int?
)

object UserConfigApi {
    private const val BASE_URL = "https://your-api-url.com" // Replace with your backend URL
    private val client = OkHttpClient()

    suspend fun fetchUserConfig(userId: String): UserConfig? = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/api/userConfigs/getUserConfig?userId=$userId"
        val request = Request.Builder().url(url).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@withContext null
            val body = response.body?.string() ?: return@withContext null
            val json = JSONObject(body)
            return@withContext UserConfig(
                version = json.optString("version"),
                defaultDeload = json.optInt("defaultDeload"),
                deloadOptions = json.optJSONArray("deloadOptions")?.let { arr -> List(arr.length()) { arr.getInt(it) } },
                maxRestTimeSec = json.optInt("maxRestTimeSec"),
                weightIncrementLbs = json.optDouble("weightIncrementLbs"),
                autoPurgeDays = json.optInt("autoPurgeDays"),
                summarizeOn = json.optString("summarizeOn"),
                maxMonthlySummaries = json.optInt("maxMonthlySummaries"),
                maxYearlySummaries = json.optInt("maxYearlySummaries"),
                smartSetNudges = json.optBoolean("smartSetNudges"),
                dynamicDeload = json.optBoolean("dynamicDeload"),
                cycleLengthWeeks = json.optInt("cycleLengthWeeks")
            )
        }
    }

    suspend fun setUserConfig(userId: String, config: UserConfig): Boolean = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/api/userConfigs/setUserConfig"
        val json = JSONObject()
        json.put("userId", userId)
        json.put("configJson", JSONObject().apply {
            put("version", config.version)
            put("defaultDeload", config.defaultDeload)
            put("deloadOptions", config.deloadOptions)
            put("maxRestTimeSec", config.maxRestTimeSec)
            put("weightIncrementLbs", config.weightIncrementLbs)
            put("autoPurgeDays", config.autoPurgeDays)
            put("summarizeOn", config.summarizeOn)
            put("maxMonthlySummaries", config.maxMonthlySummaries)
            put("maxYearlySummaries", config.maxYearlySummaries)
            put("smartSetNudges", config.smartSetNudges)
            put("dynamicDeload", config.dynamicDeload)
            put("cycleLengthWeeks", config.cycleLengthWeeks)
        }.toString())
        val body = json.toString().toRequestBody("application/json".toMediaTypeOrNull())
        val request = Request.Builder().url(url).post(body).build()
        client.newCall(request).execute().use { response ->
            return@withContext response.isSuccessful
        }
    }
}
