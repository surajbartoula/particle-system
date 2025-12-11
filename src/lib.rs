use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct WasmCalculator {
    time_offset: f32,
}

#[wasm_bindgen]
impl WasmCalculator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmCalculator {
        WasmCalculator { time_offset: 0.0 }
    }

    #[wasm_bindgen]
    pub fn calculate_wave(&self, x: f32, z: f32, time: f32) -> f32 {
        let wave1 = (x * 0.5 + time).sin() * (z * 0.5 + time).cos();
        let wave2 = (x * 0.3 - time * 0.5).cos() * (z * 0.4 + time * 0.3).sin();
        (wave1 + wave2 * 0.5) * 2.0
    }

    #[wasm_bindgen]
    pub fn calculate_spiral_x(&self, index: i32, total: i32, time: f32) -> f32 {
        let t = index as f32 / total as f32;
        let angle = t * PI * 4.0 + time;
        let radius = t * 5.0;
        angle.cos() * radius
    }

    #[wasm_bindgen]
    pub fn calculate_spiral_y(&self, index: i32, time: f32) -> f32 {
        (time + index as f32 * 0.1).sin() * 2.0
    }

    #[wasm_bindgen]
    pub fn calculate_spiral_z(&self, index: i32, total: i32, time: f32) -> f32 {
        let t = index as f32 / total as f32;
        let angle = t * PI * 4.0 + time;
        let radius = t * 5.0;
        angle.sin() * radius
    }

    #[wasm_bindgen]
    pub fn calculate_color_r(&self, x: f32) -> f32 {
        ((x * 0.3).sin() + 1.0) * 0.5
    }

    #[wasm_bindgen]
    pub fn calculate_color_g(&self, y: f32) -> f32 {
        ((y * 0.3).sin() + 1.0) * 0.5
    }

    #[wasm_bindgen]
    pub fn calculate_color_b(&self, z: f32) -> f32 {
        ((z * 0.3).sin() + 1.0) * 0.5
    }

    #[wasm_bindgen]
    pub fn perlin_noise(&self, x: f32, seed: f32) -> f32 {
        let i = x.floor();
        let f = x - i;
        
        let a = ((i + seed).sin() * 43758.5453).fract();
        let b = ((i + 1.0 + seed).sin() * 43758.5453).fract();
        
        let u = f * f * (3.0 - 2.0 * f);
        a * (1.0 - u) + b * u
    }
}

#[wasm_bindgen]
pub fn fast_wave(x: f32, z: f32, time: f32) -> f32 {
    (x * 0.5 + time).sin() * (z * 0.5 + time).cos() * 2.0
}