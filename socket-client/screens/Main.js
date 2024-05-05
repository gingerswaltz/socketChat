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

const Main = ({ navigation }) => {
  // Состояния для имени, названия комнаты, списка комнат, видимости модального окна и строки поиска
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [roomsList, setRoomsList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false); // Состояние для модального окна с ошибкой

  // Эффект для установления соединения с сервером при загрузке компонента
  useEffect(() => {
    // Подключение к серверу сокетов
    const socket = io.connect("http://213.183.59.239:8080");

    // Обработка ошибки при подключении к серверу
    socket.on("connect_error", (error) => {
      // Показать модальное окно с сообщением об ошибке при неудачном подключении
      setErrorModalVisible(true);
      console.log(error);
    });

    // Получение списка комнат при получении сообщения от сервера
    socket.on("message", ({ data }) => {
      if (data.rooms) {
        setRoomsList(data.rooms);
      }
    });

    // Отправка запроса на получение списка комнат
    socket.emit("listRoom");

    // Отключение соединения с сервером при размонтировании компонента
    return () => {
      socket.disconnect();
    };
  }, []);

  // Обработка нажатия кнопки "Sign In"
  const handlePress = () => {
    // Проверка, что имя пользователя и название комнаты не пустые
    if (!name || !room) return;
    // Переход на экран чата с указанным именем пользователя и названием комнаты
    navigation.navigate("Chat", {
      name: name,
      room: room,
    });
  };

  // Обработка выбора комнаты из списка
  const handleRoomSelect = (selectedRoom) => {
    // Установка выбранной комнаты и скрытие модального окна
    setRoom(selectedRoom);
    setModalVisible(false);
  };

  // Функция для обновления списка комнат и отображения модального окна
  const updateListRoom = (isModalVisible) => {
    // Установка видимости модального окна
    setModalVisible(isModalVisible);
    // Установка нового соединения с сервером сокетов
    const socket = io.connect("http://213.183.59.239:8080");

    // Обработка ошибки при подключении к серверу
    socket.on("connect_error", (error) => {
      // Показать модальное окно с сообщением об ошибке при неудачном подключении
      setErrorModalVisible(true);
    });

    // Отправка запроса на получение списка комнат
    socket.emit("listRoom");

    // Получение списка комнат при получении сообщения от сервера
    socket.on("message", ({ data }) => {
      if (data.rooms) {
        setRoomsList(data.rooms);
      }
    });

    // Отключение соединения с сервером при размонтировании компонента
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
    marginBottom: 190,
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
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

export default Main;
