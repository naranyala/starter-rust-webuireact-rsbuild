/// Communication configuration for backend-frontend interaction
/// This module defines and displays the available transport and serialization options

use tracing::{info, debug};
use super::serialization::display_serialization_details;

/// Available transport protocols for backend-frontend communication
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportProtocol {
    /// WebSocket - Full-duplex communication over a single TCP connection
    WebSocket,
    /// HTTP/REST - Request-response based communication
    HttpRest,
    /// Server-Sent Events (SSE) - Server-to-client streaming
    ServerSentEvents,
    /// gRPC - High-performance RPC framework
    Grpc,
}

impl TransportProtocol {
    pub fn name(&self) -> &'static str {
        match self {
            TransportProtocol::WebSocket => "WebSocket",
            TransportProtocol::HttpRest => "HTTP/REST",
            TransportProtocol::ServerSentEvents => "Server-Sent Events (SSE)",
            TransportProtocol::Grpc => "gRPC",
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            TransportProtocol::WebSocket => "Full-duplex, low-latency, persistent connection",
            TransportProtocol::HttpRest => "Request-response, stateless, widely supported",
            TransportProtocol::ServerSentEvents => "Server-to-client streaming, simple protocol",
            TransportProtocol::Grpc => "Binary protocol, streaming, strongly typed",
        }
    }

    pub fn library(&self) -> &'static str {
        match self {
            TransportProtocol::WebSocket => "tokio-tungstenite",
            TransportProtocol::HttpRest => "tiny_http / reqwest",
            TransportProtocol::ServerSentEvents => "axum / actix-web",
            TransportProtocol::Grpc => "tonic",
        }
    }

    pub fn port(&self) -> u16 {
        match self {
            TransportProtocol::WebSocket => 9000,
            TransportProtocol::HttpRest => 8080,
            TransportProtocol::ServerSentEvents => 8080,
            TransportProtocol::Grpc => 50051,
        }
    }
}

/// Available serialization formats for data exchange
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SerializationFormat {
    /// JSON - JavaScript Object Notation
    Json,
    /// MessagePack - Binary serialization format
    MessagePack,
    /// Protocol Buffers - Google's interface definition language
    Protobuf,
    /// CBOR - Concise Binary Object Representation
    Cbor,
}

impl SerializationFormat {
    pub fn name(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "JSON",
            SerializationFormat::MessagePack => "MessagePack",
            SerializationFormat::Protobuf => "Protocol Buffers",
            SerializationFormat::Cbor => "CBOR",
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "Human-readable, widely supported, text-based",
            SerializationFormat::MessagePack => "Binary format, compact, fast serialization",
            SerializationFormat::Protobuf => "Schema-based, efficient, strongly typed",
            SerializationFormat::Cbor => "Binary JSON alternative, RFC 7049 standard",
        }
    }

    pub fn library(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "serde_json",
            SerializationFormat::MessagePack => "rmp-serde",
            SerializationFormat::Protobuf => "prost / protobuf",
            SerializationFormat::Cbor => "serde_cbor",
        }
    }

    pub fn characteristics(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "Text, verbose, interoperable",
            SerializationFormat::MessagePack => "Binary, compact, fast",
            SerializationFormat::Protobuf => "Binary, schema-based, efficient",
            SerializationFormat::Cbor => "Binary, self-describing, standard",
        }
    }
}

/// Communication configuration displaying all options and selected ones
pub struct CommunicationConfig {
    pub selected_transport: TransportProtocol,
    pub selected_serialization: SerializationFormat,
}

impl CommunicationConfig {
    /// Create a new communication configuration
    pub fn new(transport: TransportProtocol, serialization: SerializationFormat) -> Self {
        Self {
            selected_transport: transport,
            selected_serialization: serialization,
        }
    }

    /// Display all available transport options
    fn display_transport_options(&self) {
        info!("┌─────────────────────────────────────────────────────────────────────────────┐");
        info!("│                        TRANSPORT OPTIONS                                    │");
        info!("├─────────────────────────────────────────────────────────────────────────────┤");
        info!("│ Protocol              │ Library            │ Port   │ Description          │");
        info!("├───────────────────────┼────────────────────┼────────┼──────────────────────┤");

        let protocols = [
            TransportProtocol::WebSocket,
            TransportProtocol::HttpRest,
            TransportProtocol::ServerSentEvents,
            TransportProtocol::Grpc,
        ];

        for protocol in protocols {
            let marker = if protocol == self.selected_transport { "►" } else { " " };
            let display_name = if protocol == self.selected_transport {
                format!("{} {}", marker, protocol.name())
            } else {
                format!("  {}", protocol.name())
            };
            info!(
                "│ {:<21} │ {:<18} │ {:<6} │ {:<20} │",
                display_name,
                protocol.library(),
                protocol.port().to_string(),
                protocol.description()
            );
        }

        info!("└─────────────────────────────────────────────────────────────────────────────┘");
    }

    /// Display all available serialization options
    fn display_serialization_options(&self) {
        info!("┌─────────────────────────────────────────────────────────────────────────────┐");
        info!("│                      SERIALIZATION OPTIONS                                  │");
        info!("├─────────────────────────────────────────────────────────────────────────────┤");
        info!("│ Format                │ Library            │ Characteristics              │");
        info!("├───────────────────────┼────────────────────┼──────────────────────────────┤");

        let formats = [
            SerializationFormat::Json,
            SerializationFormat::MessagePack,
            SerializationFormat::Protobuf,
            SerializationFormat::Cbor,
        ];

        for format in formats {
            let marker = if format == self.selected_serialization { "►" } else { " " };
            let display_name = if format == self.selected_serialization {
                format!("{} {}", marker, format.name())
            } else {
                format!("  {}", format.name())
            };
            info!(
                "│ {:<21} │ {:<18} │ {:<30} │",
                display_name,
                format.library(),
                format.characteristics()
            );
        }

        info!("└─────────────────────────────────────────────────────────────────────────────┘");
    }

    /// Display the selected communication configuration
    fn display_selected_config(&self) {
        info!("┌─────────────────────────────────────────────────────────────────────────────┐");
        info!("│                     SELECTED CONFIGURATION                                  │");
        info!("├─────────────────────────────────────────────────────────────────────────────┤");
        info!("│ Transport:    {:<62} │", self.selected_transport.name());
        info!("│   Library:    {:<62} │", self.selected_transport.library());
        info!("│   Port:       {:<62} │", format!("{} ({})", self.selected_transport.port(), if self.selected_transport == TransportProtocol::WebSocket { "backend-frontend" } else { "default" }));
        info!("│   Features:   {:<62} │", self.selected_transport.description());
        info!("├─────────────────────────────────────────────────────────────────────────────┤");
        info!("│ Serialization:{:<62} │", self.selected_serialization.name());
        info!("│   Library:    {:<62} │", self.selected_serialization.library());
        info!("│   Features:   {:<62} │", self.selected_serialization.description());
        info!("└─────────────────────────────────────────────────────────────────────────────┘");
    }

    /// Display the complete communication configuration to the log
    pub fn display(&self) {
        info!("");
        info!("╔═════════════════════════════════════════════════════════════════════════════╗");
        info!("║              BACKEND-FRONTEND COMMUNICATION CONFIGURATION                   ║");
        info!("╚═════════════════════════════════════════════════════════════════════════════╝");
        info!("");

        self.display_transport_options();
        info!("");

        self.display_serialization_options();
        info!("");

        self.display_selected_config();
        info!("");
        
        // Display detailed serialization information
        display_serialization_details();
        
        // Display feature status
        Self::display_feature_status();
    }
    
    /// Display which serialization features are enabled
    fn display_feature_status() {
        info!("╔═════════════════════════════════════════════════════════════════════════════╗");
        info!("║                  SERIALIZATION FEATURE STATUS                               ║");
        info!("╠═════════════════════════════════════════════════════════════════════════════╣");
        
        #[cfg(feature = "json")]
        info!("║ ✓ JSON          │ Enabled  │ Default format for web compatibility            ║");
        #[cfg(not(feature = "json"))]
        info!("║ ✗ JSON          │ Disabled │ Add 'json' feature to enable                    ║");
        
        #[cfg(feature = "msgpack")]
        info!("║ ✓ MessagePack   │ Enabled  │ 30-40% smaller than JSON, very fast             ║");
        #[cfg(not(feature = "msgpack"))]
        info!("║ ✗ MessagePack   │ Disabled │ Add 'msgpack' feature to enable                 ║");
        
        #[cfg(feature = "cbor")]
        info!("║ ✓ CBOR          │ Enabled  │ RFC 7049 standard, good for IoT                 ║");
        #[cfg(not(feature = "cbor"))]
        info!("║ ✗ CBOR          │ Disabled │ Add 'cbor' feature to enable                    ║");
        
        #[cfg(feature = "protobuf")]
        info!("║ ✓ Protobuf      │ Enabled  │ Schema-based, best compression                  ║");
        #[cfg(not(feature = "protobuf"))]
        info!("║ ✗ Protobuf      │ Disabled │ Add 'protobuf' feature to enable                ║");
        
        info!("╠═════════════════════════════════════════════════════════════════════════════╣");
        info!("║ Build with: cargo build --features 'all-formats'                            ║");
        info!("║ Or: cargo build --features 'msgpack cbor'                                   ║");
        info!("╚═════════════════════════════════════════════════════════════════════════════╝");
        info!("");
    }
}

/// Default communication configuration for this application
pub fn get_default_config() -> CommunicationConfig {
    CommunicationConfig::new(
        TransportProtocol::WebSocket,
        SerializationFormat::Json,
    )
}

/// Initialize and display communication configuration
pub fn init_communication_config() -> CommunicationConfig {
    let config = get_default_config();
    config.display();
    config
}

/// Display communication information (simplified version)
pub fn display_communication_info() {
    let config = get_default_config();
    config.display();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transport_protocol_names() {
        assert_eq!(TransportProtocol::WebSocket.name(), "WebSocket");
        assert_eq!(TransportProtocol::HttpRest.name(), "HTTP/REST");
    }

    #[test]
    fn test_serialization_format_names() {
        assert_eq!(SerializationFormat::Json.name(), "JSON");
        assert_eq!(SerializationFormat::MessagePack.name(), "MessagePack");
    }

    #[test]
    fn test_default_config() {
        let config = get_default_config();
        assert_eq!(config.selected_transport, TransportProtocol::WebSocket);
        assert_eq!(config.selected_serialization, SerializationFormat::Json);
    }
}
