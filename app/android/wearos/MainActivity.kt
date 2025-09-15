package com.example.technicallyfit.wearos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WearApp()
        }
    }
}

@Composable
fun WearApp() {
    var heartRate by remember { mutableStateOf(72) }
    var spo2 by remember { mutableStateOf(98) }
    var strain by remember { mutableStateOf(45) }
    var feedback by remember { mutableStateOf("") }

    Scaffold(
        timeText = { TimeText() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Technically Fit", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Text("Heart Rate: $heartRate bpm", color = Color.Red, fontSize = 16.sp)
            Text("SpO₂: $spo2%", color = Color.Blue, fontSize = 16.sp)
            Text("Strain: $strain/100", color = Color.Green, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(16.dp))
            Text("Feedback:", color = Color.White, fontSize = 14.sp)
            Row {
                Button(onClick = { feedback = "Set Completed" }) { Text("✔️") }
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { feedback = "Too Easy" }) { Text("😃") }
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { feedback = "Too Hard" }) { Text("😫") }
            }
            Spacer(modifier = Modifier.height(8.dp))
            if (feedback.isNotEmpty()) {
                Text("Selected: $feedback", color = Color.Yellow, fontSize = 14.sp)
            }
        }
    }
}
