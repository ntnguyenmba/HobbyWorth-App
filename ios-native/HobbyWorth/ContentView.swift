import SwiftUI

struct Hobby: Identifiable, Hashable {
    let id: String
    let name: String
    let category: String
}

private let hobbies: [Hobby] = [
    .init(id: "baking", name: "Baking", category: "Food"),
    .init(id: "cooking", name: "Cooking", category: "Food"),
    .init(id: "coffee-making", name: "Coffee Making", category: "Food"),
    .init(id: "candle-making", name: "Candle Making", category: "Craft"),
    .init(id: "jewelry-making", name: "Jewelry Making", category: "Craft"),
    .init(id: "crochet", name: "Crochet", category: "Craft"),
    .init(id: "knitting", name: "Knitting", category: "Craft"),
    .init(id: "sewing", name: "Sewing", category: "Craft"),
    .init(id: "painting", name: "Painting", category: "Art"),
    .init(id: "watercolor", name: "Watercolor", category: "Art"),
    .init(id: "photography", name: "Photography", category: "Photo"),
    .init(id: "videography", name: "Videography", category: "Photo"),
    .init(id: "graphic-design", name: "Graphic Design", category: "Digital"),
    .init(id: "web-design", name: "Web Design", category: "Digital"),
    .init(id: "woodworking", name: "Woodworking", category: "Home"),
    .init(id: "furniture-flipping", name: "Furniture Flipping", category: "Resale")
]

private enum HWColor {
    static let cream = Color(red: 1.0, green: 0.992, blue: 0.969)
    static let ink = Color(red: 0.141, green: 0.196, blue: 0.220)
    static let coral = Color(red: 1.0, green: 0.333, blue: 0.282)
    static let teal = Color(red: 0.286, green: 0.655, blue: 0.745)
    static let pink = Color(red: 1.0, green: 0.941, blue: 0.925)
}

enum Route: Hashable {
    case quiz
    case browse
    case calculator(Hobby)
    case settings
}

struct ContentView: View {
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(path: $path)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .quiz: QuizView()
                    case .browse: HobbyListView()
                    case .calculator(let hobby): CalculatorView(hobby: hobby)
                    case .settings: SettingsView()
                    }
                }
        }
        .tint(HWColor.coral)
    }
}

struct HomeView: View {
    @Binding var path: [Route]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text("HobbyWorth")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                    Spacer()
                    Button("Settings") { path.append(.settings) }
                        .font(.headline)
                }

                ZStack(alignment: .bottomLeading) {
                    RoundedRectangle(cornerRadius: 28)
                        .fill(LinearGradient(colors: [HWColor.teal, Color(red: 0.51, green: 0.84, blue: 0.95)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(height: 220)
                    Text("Find a hobby\nworth your time.")
                        .font(.system(size: 36, weight: .black, design: .rounded))
                        .foregroundStyle(HWColor.ink)
                        .padding(24)
                }

                Text("Pick something you can actually start, then see what one project costs and what it could earn.")
                    .font(.system(size: 18, design: .rounded))
                    .foregroundStyle(HWColor.ink)
                    .lineSpacing(3)

                VStack(spacing: 12) {
                    Button("Take the hobby quiz") { path.append(.quiz) }
                        .buttonStyle(FilledButtonStyle())
                    Button("Browse all hobbies") { path.append(.browse) }
                        .buttonStyle(OutlineButtonStyle())
                }
                .padding(18)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 22))

                Text("No account required. Your project numbers stay on your device.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
        }
        .background(HWColor.cream)
        .navigationBarHidden(true)
    }
}

struct HobbyListView: View {
    @State private var search = ""
    private var filtered: [Hobby] {
        search.isEmpty ? hobbies : hobbies.filter { $0.name.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        List(filtered) { hobby in
            NavigationLink(value: Route.calculator(hobby)) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(hobby.name).font(.headline)
                    Text(hobby.category).font(.caption).foregroundStyle(.secondary)
                }
                .padding(.vertical, 5)
            }
        }
        .searchable(text: $search, prompt: "Search hobbies")
        .navigationTitle("Hobbies")
    }
}

struct QuizView: View {
    private let questions = [
        ("What sounds most fun?", ["Making something", "Digital work", "Photo or video", "Finding and reselling"]),
        ("What do you want to spend to start?", ["As little as possible", "A moderate amount", "I am flexible"]),
        ("How much time do you want to spend?", ["Under an hour", "A few hours", "A longer project"]),
        ("What is the goal?", ["Finish something", "Try selling it", "Repeat it regularly"])
    ]

    @State private var step = 0
    @State private var selected = -1

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if step < questions.count {
                    Text("\(step + 1) / \(questions.count)")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)

                    Text(questions[step].0)
                        .font(.system(size: 32, weight: .black, design: .rounded))

                    ForEach(Array(questions[step].1.enumerated()), id: \.offset) { index, option in
                        Button {
                            selected = index
                        } label: {
                            HStack {
                                Text(option)
                                Spacer()
                                if selected == index {
                                    Image(systemName: "checkmark.circle.fill")
                                }
                            }
                            .font(.headline)
                            .foregroundStyle(HWColor.ink)
                            .padding(18)
                            .background(selected == index ? HWColor.pink : .white)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                        }
                    }

                    Button(step == questions.count - 1 ? "See my matches" : "Next") {
                        guard selected >= 0 else { return }
                        step += 1
                        selected = -1
                    }
                    .buttonStyle(FilledButtonStyle())
                } else {
                    Text("Your matches")
                        .font(.system(size: 32, weight: .black, design: .rounded))

                    ForEach(Array(hobbies.prefix(3).enumerated()), id: \.element.id) { index, hobby in
                        NavigationLink(value: Route.calculator(hobby)) {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(String(format: "%02d", index + 1))
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                                Text(hobby.name)
                                    .font(.title2.bold())
                                    .foregroundStyle(HWColor.ink)
                                Text("Start this hobby")
                                    .font(.subheadline.bold())
                                    .foregroundStyle(HWColor.coral)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(18)
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(HWColor.cream)
        .navigationTitle("Quiz")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct CalculatorView: View {
    let hobby: Hobby

    @State private var cost = ""
    @State private var minutes = ""
    @State private var quantity = ""
    @State private var price = ""

    private var costValue: Double { Double(cost) ?? 0 }
    private var minutesValue: Double { Double(minutes) ?? 0 }
    private var quantityValue: Double { Double(quantity) ?? 0 }
    private var priceValue: Double { Double(price) ?? 0 }
    private var leftover: Double { quantityValue * priceValue - costValue }
    private var perItem: Double { quantityValue > 0 ? leftover / quantityValue : 0 }
    private var perHour: Double { minutesValue > 0 ? leftover / (minutesValue / 60) : 0 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(hobby.name)
                    .font(.system(size: 34, weight: .black, design: .rounded))

                NumberField(title: "Total cost", text: $cost, prefix: "$")
                NumberField(title: "Minutes", text: $minutes)
                NumberField(title: "How many you make", text: $quantity)
                NumberField(title: "Price each", text: $price, prefix: "$")

                Text(leftover > 0 ? "This batch is above your entered cost." : "Enter your numbers to test the batch.")
                    .font(.headline)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(HWColor.pink)
                    .clipShape(RoundedRectangle(cornerRadius: 18))

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    MetricCard(label: "Left after cost", value: leftover.currency)
                    MetricCard(label: "Per item", value: perItem.currency)
                    MetricCard(label: "Per hour", value: perHour.currency)
                    MetricCard(label: "Revenue", value: (quantityValue * priceValue).currency)
                }

                Text("These are planning estimates based only on the numbers you enter.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
        }
        .background(HWColor.cream)
    }
}

struct SettingsView: View {
    var body: some View {
        List {
            Section("About") {
                LabeledContent("App", value: "HobbyWorth")
                LabeledContent("Version", value: "1.0")
            }
            Section("Privacy") {
                Text("Your hobby and calculator entries are designed to stay on this device.")
            }
            Section("Build") {
                Text("Native iOS app built with SwiftUI.")
            }
        }
        .navigationTitle("Settings")
    }
}

struct NumberField: View {
    let title: String
    @Binding var text: String
    var prefix: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption.bold()).foregroundStyle(.secondary)
            HStack {
                if !prefix.isEmpty { Text(prefix).foregroundStyle(.secondary) }
                TextField("0", text: $text)
                    .keyboardType(.decimalPad)
            }
            .padding(14)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }
}

struct MetricCard: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct FilledButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .foregroundStyle(.white)
            .background(HWColor.coral.opacity(configuration.isPressed ? 0.82 : 1))
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct OutlineButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .foregroundStyle(HWColor.ink)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(HWColor.ink.opacity(0.2)))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

private extension Double {
    var currency: String {
        formatted(.currency(code: "USD").precision(.fractionLength(0...2)))
    }
}

#Preview {
    ContentView()
}
