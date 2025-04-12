document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand(); // Раскрываем Mini App на весь экран

    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const taskText = document.getElementById('taskText').value;
        const deadline = document.getElementById('deadline').value;
        
        tg.sendData(JSON.stringify({
            action: 'create_task',
            text: taskText,
            deadline: deadline
        }));
        
        tg.close();
    });
});
