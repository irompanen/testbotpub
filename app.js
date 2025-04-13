document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Инициализация
    const user = tg.initDataUnsafe.user;
    const taskForm = document.getElementById('taskForm');
    
    // Показываем данные пользователя (опционально)
    if (user) {
        console.log(`Пользователь: ${user.first_name} (ID: ${user.id})`);
    }
    
    // Обработка формы
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const taskText = document.getElementById('taskText').value;
        
        // Отправляем данные в бота
        tg.sendData(JSON.stringify({
            action: 'create_task',
            text: taskText,
            user_id: user?.id
        }));
        
        tg.close();
    });
});
