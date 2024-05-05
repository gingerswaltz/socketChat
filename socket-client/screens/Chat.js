import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  Modal, // Импорт Modal для отображения модального окна
} from "react-native";
import io from "socket.io-client";

const socket = io.connect("http://192.168.0.12");

const Chat = ({ navigation, route }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState(0);
  const [errorModalVisible, setErrorModalVisible] = useState(false); // Состояние для модального окна с ошибкой

  useEffect(() => {
    socket.on("message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("messageHistory", (data) => {
      setMessages(data.data.messages);
    });

    socket.on("room", (data) => {
      const usersArray = data.data.users;
      setUsers(usersArray.length);
    });

    socket.emit("join", { name: route.params.name, room: route.params.room });

    // Обработка ошибки при подключении к сокету
    socket.on("connect_error", (error) => {
      setErrorModalVisible(true);
    });

    return () => {
      socket.off("message");
      socket.off("room");
    };
  }, []);

  const handleChange = (text) => {
    setMessage(text);
  };

  const handleSubmit = () => {
    socket.emit("sendMessage", { message, params: route.params });
    setMessage("");
  };

  const leftRoom = () => {
    socket.emit("leftRoom", { params: route.params });
    navigation.goBack();
  };

  const renderMessage = ({ item }) => (
    <Text style={styles.message}>
      {item.user}: {item.message}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.roomName}>{route.params.room}</Text>
        <Text style={styles.userCount}>{users} users in this room</Text>
        <TouchableOpacity onPress={leftRoom}>
          <Text style={styles.leaveRoom}>Leave the room</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.messagesContainer}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What do you want to say?"
          value={message}
          onChangeText={handleChange}
          autoCompleteType="off"
          autoCapitalize="none"
          required
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSubmit}>
          <Text style={styles.sendButtonText}>Send a message</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно с сообщением об ошибке */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalContainer}>
          <View style={styles.errorModalContent}>
            <Text style={styles.errorModalText}>
              Connection to the server failed. Please check your internet
              connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  roomName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userCount: {
    fontSize: 16,
  },
  leaveRoom: {
    fontSize: 16,
    color: "blue",
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  message: {
    marginBottom: 10,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  // Стили для модального окна с ошибкой
  errorModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  errorModalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  errorModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  errorModalButton: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  errorModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Chat;
