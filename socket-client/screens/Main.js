import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import io from "socket.io-client";

const socket = io.connect("http://192.168.0.12");

const Main = ({ navigation }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [roomsList, setRoomsList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Добавлено состояние для поискового запроса

  useEffect(() => {
    socket.on("message", ({ data }) => {
      if (data.rooms) {
        setRoomsList(data.rooms);
      }
    });

    socket.emit("listRoom");

    return () => {
      socket.disconnect();
    };
  }, []);

  const handlePress = () => {
    if (!name || !room) return;
    navigation.navigate("Chat", {
      name: name,
      room: room,
    });
  };

  const handleRoomSelect = (selectedRoom) => {
    setRoom(selectedRoom);
    setModalVisible(false);
  };

  const updateListRoom = (isModalVisible) => {
    setModalVisible(isModalVisible);
    socket.emit("listRoom");
    socket.on("message", ({ data }) => {
      if (data.rooms) {
        setRoomsList(data.rooms);
      }
    });
    return () => {
      socket.disconnect();
    };
  };

  return (
    <View
      style={[styles.container, Platform.OS === "ios" && styles.containerIOS]}
    >
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => updateListRoom(true)}
      >
        <Text style={styles.selectButtonText}>Select a Room</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Join</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={name}
        onChangeText={setName}
        autoCompleteType="username"
        autoCapitalize="none"
        autoFocus={true}
      />
      <TextInput
        style={styles.input}
        placeholder="Room"
        value={room}
        onChangeText={setRoom}
        autoCompleteType="off"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Модальное окно для отображения списка комнат */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select a Room</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rooms..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCompleteType="off"
              autoCapitalize="none"
            />
            {/* Фильтрация и рендеринг списка комнат на основе введенного запроса */}
            {roomsList
              .filter((roomItem) =>
                roomItem.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((filteredRoom, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.roomItem}
                  onPress={() => handleRoomSelect(filteredRoom)}
                >
                  <Text>{filteredRoom}</Text>
                </TouchableOpacity>
              ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#f5f5f5",
  },
  containerIOS: {
    marginBottom: 190, // Дополнительное расстояние margin снизу для iOS
  },
  heading: {
    fontSize: 32,
    marginBottom: 40,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "blue",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
  selectButton: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "blue",
    borderRadius: 10,
    elevation: 3,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: "80%",
  },
  modalHeading: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  roomItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  searchInput: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
    ...Platform.select({
      ios: {
        backgroundColor: "#444444",
      },
    }),
  },
});

export default Main;
