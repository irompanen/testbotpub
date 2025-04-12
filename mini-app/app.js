document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand(); // Раскрываем Mini App на весь экран

    // Получаем данные пользователя
    const user = tg.initDataUnsafe.user;
    if (user) {
        console.log(`Пользователь: ${user.first_name} (ID: ${user.id})`);
    }

    // Обработка формы
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskText = document.getElementById('taskText').value;
        const deadline = document.getElementById('deadline').value;

        // Отправляем данные в бота через Telegram WebApp API
        tg.sendData(JSON.stringify({
            action: 'create_task',
            text: taskText,
            deadline: deadline
        }));

        // Закрываем Mini App после отправки
        tg.close();
    });
});