import Foundation

struct UserConfig: Codable {
    var version: String?
    var defaultDeload: Int?
    var deloadOptions: [Int]?
    var maxRestTimeSec: Int?
    var weightIncrementLbs: Double?
    var autoPurgeDays: Int?
    var summarizeOn: String?
    var maxMonthlySummaries: Int?
    var maxYearlySummaries: Int?
    var smartSetNudges: Bool?
    var dynamicDeload: Bool?
    var cycleLengthWeeks: Int?
}

class UserConfigAPI {
    static let shared = UserConfigAPI()
    private let baseURL = URL(string: "https://your-api-url.com")! // Replace with your backend URL

    func fetchUserConfig(userId: String, completion: @escaping (UserConfig?) -> Void) {
        let url = baseURL.appendingPathComponent("/api/userConfigs/getUserConfig?userId=\(userId)")
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data, error == nil else {
                completion(nil)
                return
            }
            do {
                let config = try JSONDecoder().decode(UserConfig.self, from: data)
                completion(config)
            } catch {
                completion(nil)
            }
        }
        task.resume()
    }

    func setUserConfig(userId: String, config: UserConfig, completion: @escaping (Bool) -> Void) {
        let url = baseURL.appendingPathComponent("/api/userConfigs/setUserConfig")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "userId": userId,
            "configJson": String(data: try! JSONEncoder().encode(config), encoding: .utf8) ?? "{}"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            completion(error == nil)
        }
        task.resume()
    }
}
