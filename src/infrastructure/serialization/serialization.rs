/// Serialization module supporting multiple formats
/// Provides unified interface for JSON, MessagePack, CBOR, and Protobuf

use serde::{Deserialize, Serialize};
use serde_json::Value;
#[allow(unused_imports)]
use tracing::debug;

/// Supported serialization formats
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SerializationFormat {
    Json,
    MessagePack,
    Cbor,
    Protobuf,
}

impl SerializationFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "json",
            SerializationFormat::MessagePack => "msgpack",
            SerializationFormat::Cbor => "cbor",
            SerializationFormat::Protobuf => "protobuf",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "json" => Some(SerializationFormat::Json),
            "msgpack" | "messagepack" | "msg" => Some(SerializationFormat::MessagePack),
            "cbor" => Some(SerializationFormat::Cbor),
            "protobuf" | "proto" | "pb" => Some(SerializationFormat::Protobuf),
            _ => None,
        }
    }

    pub fn mime_type(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "application/json",
            SerializationFormat::MessagePack => "application/x-msgpack",
            SerializationFormat::Cbor => "application/cbor",
            SerializationFormat::Protobuf => "application/x-protobuf",
        }
    }

    pub fn is_binary(&self) -> bool {
        match self {
            SerializationFormat::Json => false,
            SerializationFormat::MessagePack => true,
            SerializationFormat::Cbor => true,
            SerializationFormat::Protobuf => true,
        }
    }
}

/// WebSocket message envelope for all serialization formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsMessage {
    pub id: String,
    pub name: String,
    pub payload: Value,
    pub timestamp: u64,
    pub source: String,
    #[serde(default)]
    pub format: Option<String>,
}

impl WsMessage {
    pub fn new(name: &str, payload: Value, source: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            payload,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source: source.to_string(),
            format: None,
        }
    }

    pub fn with_format(mut self, format: SerializationFormat) -> Self {
        self.format = Some(format.as_str().to_string());
        self
    }

    pub fn response(id: &str, name: &str, payload: Value) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            payload,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source: "backend".to_string(),
            format: None,
        }
    }
}

/// Serialization engine supporting multiple formats
pub struct SerializationEngine {
    format: SerializationFormat,
}

impl SerializationEngine {
    pub fn new(format: SerializationFormat) -> Self {
        Self { format }
    }

    pub fn format(&self) -> SerializationFormat {
        self.format
    }

    /// Serialize a message to bytes
    pub fn serialize(&self, message: &WsMessage) -> Result<Vec<u8>, SerializationError> {
        match self.format {
            SerializationFormat::Json => self.serialize_json(message),
            SerializationFormat::MessagePack => self.serialize_msgpack(message),
            SerializationFormat::Cbor => self.serialize_cbor(message),
            SerializationFormat::Protobuf => self.serialize_protobuf(message),
        }
    }

    /// Deserialize bytes to a message
    pub fn deserialize(&self, data: &[u8]) -> Result<WsMessage, SerializationError> {
        match self.format {
            SerializationFormat::Json => self.deserialize_json(data),
            SerializationFormat::MessagePack => self.deserialize_msgpack(data),
            SerializationFormat::Cbor => self.deserialize_cbor(data),
            SerializationFormat::Protobuf => self.deserialize_protobuf(data),
        }
    }

    /// Serialize to JSON string
    fn serialize_json(&self, message: &WsMessage) -> Result<Vec<u8>, SerializationError> {
        serde_json::to_vec(message)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// Deserialize from JSON string
    fn deserialize_json(&self, data: &[u8]) -> Result<WsMessage, SerializationError> {
        serde_json::from_slice(data)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// Serialize to MessagePack
    fn serialize_msgpack(&self, message: &WsMessage) -> Result<Vec<u8>, SerializationError> {
        #[cfg(feature = "msgpack")]
        {
            rmp_serde::to_vec(message)
                .map_err(|e| SerializationError::MessagePackError(e.to_string()))
        }
        #[cfg(not(feature = "msgpack"))]
        {
            Err(SerializationError::FeatureNotEnabled("msgpack".to_string()))
        }
    }

    /// Deserialize from MessagePack
    fn deserialize_msgpack(&self, data: &[u8]) -> Result<WsMessage, SerializationError> {
        #[cfg(feature = "msgpack")]
        {
            rmp_serde::from_slice(data)
                .map_err(|e| SerializationError::MessagePackError(e.to_string()))
        }
        #[cfg(not(feature = "msgpack"))]
        {
            Err(SerializationError::FeatureNotEnabled("msgpack".to_string()))
        }
    }

    /// Serialize to CBOR
    fn serialize_cbor(&self, message: &WsMessage) -> Result<Vec<u8>, SerializationError> {
        #[cfg(feature = "cbor")]
        {
            serde_cbor::to_vec(message)
                .map_err(|e| SerializationError::CborError(e.to_string()))
        }
        #[cfg(not(feature = "cbor"))]
        {
            Err(SerializationError::FeatureNotEnabled("cbor".to_string()))
        }
    }

    /// Deserialize from CBOR
    fn deserialize_cbor(&self, data: &[u8]) -> Result<WsMessage, SerializationError> {
        #[cfg(feature = "cbor")]
        {
            serde_cbor::from_slice(data)
                .map_err(|e| SerializationError::CborError(e.to_string()))
        }
        #[cfg(not(feature = "cbor"))]
        {
            Err(SerializationError::FeatureNotEnabled("cbor".to_string()))
        }
    }

    /// Serialize to Protobuf (simplified - would need .proto definition)
    fn serialize_protobuf(&self, _message: &WsMessage) -> Result<Vec<u8>, SerializationError> {
        // Protobuf requires schema definition and code generation
        // This is a placeholder for demonstration
        Err(SerializationError::ProtobufNotImplemented)
    }

    /// Deserialize from Protobuf
    fn deserialize_protobuf(&self, _data: &[u8]) -> Result<WsMessage, SerializationError> {
        Err(SerializationError::ProtobufNotImplemented)
    }

    /// Get comparison statistics for different formats
    pub fn get_format_comparison(message: &WsMessage) -> FormatComparison {
        let json_size = serde_json::to_vec(message).unwrap_or_default().len();
        
        #[cfg(feature = "msgpack")]
        let msgpack_size = rmp_serde::to_vec(message).unwrap_or_default().len();
        #[cfg(not(feature = "msgpack"))]
        let msgpack_size = 0;

        #[cfg(feature = "cbor")]
        let cbor_size = serde_cbor::to_vec(message).unwrap_or_default().len();
        #[cfg(not(feature = "cbor"))]
        let cbor_size = 0;

        FormatComparison {
            json_size,
            msgpack_size,
            cbor_size,
            protobuf_size: 0, // Would need actual implementation
        }
    }
}

/// Format size comparison for analysis
#[derive(Debug, Clone)]
pub struct FormatComparison {
    pub json_size: usize,
    pub msgpack_size: usize,
    pub cbor_size: usize,
    pub protobuf_size: usize,
}

impl FormatComparison {
    pub fn display(&self, message_name: &str) {
        debug!("╔════════════════════════════════════════════════════════╗");
        debug!("║         SERIALIZATION FORMAT COMPARISON                ║");
        debug!("║         Message: {:<35} ║", truncate_str(message_name, 35));
        debug!("╠════════════════════════════════════════════════════════╣");
        debug!("║ Format        │ Size (bytes) │ Compression Ratio      ║");
        debug!("╠═══════════════┼══════════════┼════════════════════════╣");
        
        let json_ratio = if self.json_size > 0 { 100.0 } else { 0.0 };
        debug!("║ JSON          │ {:>12} │ {:>6.1}% (baseline)     ║", self.json_size, json_ratio);
        
        if self.msgpack_size > 0 {
            let ratio = (self.msgpack_size as f64 / self.json_size as f64) * 100.0;
            debug!("║ MessagePack   │ {:>12} │ {:>6.1}% ({:.1}x smaller)    ║", 
                   self.msgpack_size, ratio, self.json_size as f64 / self.msgpack_size as f64);
        }
        
        if self.cbor_size > 0 {
            let ratio = (self.cbor_size as f64 / self.json_size as f64) * 100.0;
            debug!("║ CBOR          │ {:>12} │ {:>6.1}% ({:.1}x smaller)    ║", 
                   self.cbor_size, ratio, self.json_size as f64 / self.cbor_size as f64);
        }
        
        debug!("╚════════════════════════════════════════════════════════╝");
    }
}

/// Serialization errors
#[derive(Debug, Clone)]
pub enum SerializationError {
    JsonError(String),
    MessagePackError(String),
    CborError(String),
    ProtobufError(String),
    FeatureNotEnabled(String),
    ProtobufNotImplemented,
    InvalidFormat(String),
}

impl std::fmt::Display for SerializationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SerializationError::JsonError(e) => write!(f, "JSON error: {}", e),
            SerializationError::MessagePackError(e) => write!(f, "MessagePack error: {}", e),
            SerializationError::CborError(e) => write!(f, "CBOR error: {}", e),
            SerializationError::ProtobufError(e) => write!(f, "Protobuf error: {}", e),
            SerializationError::FeatureNotEnabled(feature) => {
                write!(f, "Feature '{}' not enabled. Add to Cargo.toml features.", feature)
            }
            SerializationError::ProtobufNotImplemented => {
                write!(f, "Protobuf serialization requires .proto schema definition")
            }
            SerializationError::InvalidFormat(format) => {
                write!(f, "Invalid serialization format: {}", format)
            }
        }
    }
}

impl std::error::Error for SerializationError {}

/// Helper function to truncate strings for display
fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() > max_len {
        format!("{}...", &s[..max_len - 3])
    } else {
        s.to_string()
    }
}

/// Display detailed serialization format information
pub fn display_serialization_details() {
    debug!("");
    debug!("╔═════════════════════════════════════════════════════════════════════════════╗");
    debug!("║                  SERIALIZATION FORMAT DETAILS                               ║");
    debug!("╠═════════════════════════════════════════════════════════════════════════════╣");
    debug!("║ Format        │ Type   │ Size    │ Speed    │ Use Case                    ║");
    debug!("╠═══════════════┼════════┼═════════┼══════════┼═════════════════════════════╣");
    debug!("║ JSON          │ Text   │ Large   │ Fast     │ Web APIs, debugging         ║");
    debug!("║ MessagePack   │ Binary │ Small   │ Very Fast│ Real-time, mobile apps      ║");
    debug!("║ CBOR          │ Binary │ Medium  │ Fast     │ IoT, constrained devices    ║");
    debug!("║ Protobuf      │ Binary │ Smallest│ Fastest  │ Microservices, gRPC         ║");
    debug!("╚═════════════════════════════════════════════════════════════════════════════╝");
    debug!("");
    debug!("Size Comparison (typical):");
    debug!("  • JSON: 100% (baseline)");
    debug!("  • MessagePack: ~60-70% of JSON size");
    debug!("  • CBOR: ~70-80% of JSON size");
    debug!("  • Protobuf: ~50-60% of JSON size");
    debug!("");
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_json_serialization() {
        let engine = SerializationEngine::new(SerializationFormat::Json);
        let message = WsMessage::new("test", json!({"key": "value"}), "test");
        
        let serialized = engine.serialize(&message).unwrap();
        let deserialized = engine.deserialize(&serialized).unwrap();
        
        assert_eq!(message.name, deserialized.name);
        assert_eq!(message.payload, deserialized.payload);
    }

    #[test]
    fn test_format_detection() {
        assert_eq!(SerializationFormat::from_str("json"), Some(SerializationFormat::Json));
        assert_eq!(SerializationFormat::from_str("msgpack"), Some(SerializationFormat::MessagePack));
        assert_eq!(SerializationFormat::from_str("cbor"), Some(SerializationFormat::Cbor));
        assert_eq!(SerializationFormat::from_str("protobuf"), Some(SerializationFormat::Protobuf));
        assert_eq!(SerializationFormat::from_str("invalid"), None);
    }

    #[test]
    fn test_mime_types() {
        assert_eq!(SerializationFormat::Json.mime_type(), "application/json");
        assert_eq!(SerializationFormat::MessagePack.mime_type(), "application/x-msgpack");
        assert_eq!(SerializationFormat::Cbor.mime_type(), "application/cbor");
    }
}
