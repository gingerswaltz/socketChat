// Импортируем функцию trimStr из модуля utils
const { trimStr } = require("./utils");

// Объявляем пустой массив пользователей
let users = [];

// Функция для поиска пользователя по имени и комнате
const findUser = (user) => {
  // Обрезаем пробелы в имени и комнате
  const userName = trimStr(user.name);
  const userRoom = trimStr(user.room);

  // Ищем пользователя в массиве по имени и комнате
  return users.find(
    (u) => trimStr(u.name) === userName && trimStr(u.room) === userRoom
  );
};

// Функция для получения всех пользователей
const getUsers = () => {
  return users;
};

// Функция для получения всех активных комнат
const getActiveRooms = () => {
  const activeRooms = [];
  const allUsers = getUsers();
  // Перебираем всех пользователей и собираем уникальные комнаты
  allUsers.forEach((user) => {
    if (!activeRooms.includes(user.room)) {
      activeRooms.push(user.room);
    }
  });

  return activeRooms;
};

// Функция для добавления нового пользователя
const addUser = (user) => {
  // Проверяем, существует ли пользователь
  const isExist = findUser(user);

  // Если пользователь не существует, добавляем его в массив пользователей
  !isExist && users.push(user);

  // Возвращаем информацию о пользователе
  const currentUser = isExist || user;
  return { isExist: !!isExist, user: currentUser };
};

// Функция для получения пользователей в определенной комнате
const getRoomUsers = (room) => users.filter((u) => u.room === room);

// Функция для удаления пользователя
const removeUser = (user) => {
  // Ищем пользователя
  const found = findUser(user);

  // Если пользователь найден, удаляем его из массива пользователей
  if (found) {
    users = users.filter(
      ({ room, name }) => room === found.room && name !== found.name
    );
  }

  return found;
};

// Экспортируем все необходимые функции из модуля
module.exports = {
  addUser,
  findUser,
  getRoomUsers,
  removeUser,
  getActiveRooms,
};
