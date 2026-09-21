package com.everittventures.hobbyworth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Cream = Color(0xFFFFFDF7)
private val Ink = Color(0xFF243238)
private val Coral = Color(0xFFFF5548)
private val Teal = Color(0xFF49A7BE)
private val Pink = Color(0xFFFFF0EC)

data class Hobby(val name: String, val category: String)
private val hobbies = listOf(
    Hobby("Baking", "Food"), Hobby("Cooking", "Food"), Hobby("Coffee Making", "Food"),
    Hobby("Candle Making", "Craft"), Hobby("Jewelry Making", "Craft"), Hobby("Crochet", "Craft"),
    Hobby("Knitting", "Craft"), Hobby("Sewing", "Craft"), Hobby("Painting", "Art"),
    Hobby("Watercolor", "Art"), Hobby("Photography", "Photo"), Hobby("Videography", "Photo"),
    Hobby("Graphic Design", "Digital"), Hobby("Web Design", "Digital"),
    Hobby("Woodworking", "Home"), Hobby("Furniture Flipping", "Resale")
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { HobbyWorthApp() }
    }
}

@Composable
fun HobbyWorthApp() {
    MaterialTheme(colorScheme = lightColorScheme(primary = Coral, secondary = Teal, background = Cream, surface = Color.White, onBackground = Ink, onSurface = Ink)) {
        var screen by remember { mutableStateOf("home") }
        var hobby by remember { mutableStateOf<Hobby?>(null) }
        when (screen) {
            "home" -> HomeScreen({ screen = "quiz" }, { screen = "browse" })
            "quiz" -> QuizScreen({ hobby = it; screen = "calculator" }, { screen = "home" })
            "browse" -> BrowseScreen({ hobby = it; screen = "calculator" }, { screen = "home" })
            else -> CalculatorScreen(hobby ?: hobbies.first()) { screen = "browse" }
        }
    }
}

@Composable
fun HomeScreen(onQuiz: () -> Unit, onBrowse: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Cream).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        Text("HobbyWorth", fontSize = 24.sp, fontWeight = FontWeight.Black)
        Surface(color = Teal, shape = RoundedCornerShape(28.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(24.dp).heightIn(min = 190.dp), verticalArrangement = Arrangement.Bottom) {
                Text("Find a hobby\nworth your time.", fontSize = 36.sp, lineHeight = 40.sp, fontWeight = FontWeight.Black)
            }
        }
        Text("Pick something you can actually start, then see what one project costs and what it could earn.", fontSize = 18.sp, lineHeight = 25.sp)
        Button(onClick = onQuiz, modifier = Modifier.fillMaxWidth()) { Text("Take the hobby quiz") }
        OutlinedButton(onClick = onBrowse, modifier = Modifier.fillMaxWidth()) { Text("Browse all hobbies") }
        Text("No account required. Your project numbers stay on your device.", color = Color.DarkGray, fontSize = 13.sp)
    }
}

@Composable
fun BrowseScreen(onPick: (Hobby) -> Unit, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Cream).padding(20.dp)) {
        TextButton(onClick = onBack) { Text("Back") }
        Text("Hobbies", fontSize = 32.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(12.dp))
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            hobbies.forEach { hobby ->
                OutlinedButton(onClick = { onPick(hobby) }, modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth()) {
                        Text(hobby.name, fontWeight = FontWeight.Bold)
                        Text(hobby.category, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun QuizScreen(onPick: (Hobby) -> Unit, onBack: () -> Unit) {
    var step by remember { mutableIntStateOf(0) }
    var selected by remember { mutableIntStateOf(-1) }
    val questions = listOf(
        "What sounds most fun?" to listOf("Making something", "Digital work", "Photo or video", "Finding and reselling"),
        "What do you want to spend to start?" to listOf("As little as possible", "A moderate amount", "I am flexible"),
        "How much time do you want to spend?" to listOf("Under an hour", "A few hours", "A longer project"),
        "What is the goal?" to listOf("Finish something", "Try selling it", "Repeat it regularly")
    )
    Column(Modifier.fillMaxSize().background(Cream).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        TextButton(onClick = onBack) { Text("Back") }
        if (step < questions.size) {
            Text((step + 1).toString() + " / " + questions.size.toString(), fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(questions[step].first, fontSize = 32.sp, fontWeight = FontWeight.Black)
            questions[step].second.forEachIndexed { index, option ->
                OutlinedButton(onClick = { selected = index }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.outlinedButtonColors(containerColor = if (selected == index) Pink else Color.White)) {
                    Text(option, color = Ink)
                }
            }
            Button(onClick = { if (selected >= 0) { step++; selected = -1 } }, modifier = Modifier.fillMaxWidth()) {
                Text(if (step == questions.lastIndex) "See my matches" else "Next")
            }
        } else {
            Text("Your matches", fontSize = 32.sp, fontWeight = FontWeight.Black)
            hobbies.take(3).forEach { hobby ->
                OutlinedButton(onClick = { onPick(hobby) }, modifier = Modifier.fillMaxWidth()) { Text(hobby.name, fontWeight = FontWeight.Bold) }
            }
        }
    }
}

@Composable
fun CalculatorScreen(hobby: Hobby, onBack: () -> Unit) {
    var cost by remember { mutableStateOf("") }
    var minutes by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    val c = cost.toDoubleOrNull() ?: 0.0
    val m = minutes.toDoubleOrNull() ?: 0.0
    val q = quantity.toDoubleOrNull() ?: 0.0
    val p = price.toDoubleOrNull() ?: 0.0
    val left = q * p - c
    val unit = if (q > 0) left / q else 0.0
    val hour = if (m > 0) left / (m / 60.0) else 0.0

    Column(Modifier.fillMaxSize().background(Cream).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        TextButton(onClick = onBack) { Text("Back") }
        Text(hobby.name, fontSize = 32.sp, fontWeight = FontWeight.Black)
        NumberInput("Total cost", cost) { cost = it }
        NumberInput("Minutes", minutes) { minutes = it }
        NumberInput("How many you make", quantity) { quantity = it }
        NumberInput("Price each", price) { price = it }
        Surface(color = Pink, shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
            Text(if (left > 0) "This batch is above your entered cost." else "Enter your numbers to test the batch.", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold)
        }
        Text("Left after cost: $" + "%.2f".format(left), fontWeight = FontWeight.Bold)
        Text("Per item: $" + "%.2f".format(unit), fontWeight = FontWeight.Bold)
        Text("Per hour: $" + "%.2f".format(hour), fontWeight = FontWeight.Bold)
        Text("These are planning estimates based only on the numbers you enter.", fontSize = 13.sp, color = Color.DarkGray)
    }
}

@Composable
fun NumberInput(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onChange, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
}

@Preview(showBackground = true)
@Composable
fun HobbyWorthPreview() {
    HobbyWorthApp()
}
