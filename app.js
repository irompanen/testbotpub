document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const photoInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const taskList = document.getElementById('taskList');
    
    // Обработка фото (до 10 штук)
    photoInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 10); // Ограничение 10 фото
        
        if (files.length === 0) return;
        
        files.forEach(file => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Отправка формы (без обязательных фото)
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!taskText.value.trim()) {
            tg.showAlert("Пожалуйста, опишите задачу");
            return;
        }
        
        // Скрываем клавиатуру
        tg.HapticFeedback.impactOccurred('light');
        tg.close();
        
        // Формируем данные задачи
        const formData = new FormData(taskForm);
        const taskData = {
            text: formData.get('taskText'),
            deadline: formData.get('deadline'),
            photos: Array.from(formData.getAll('photos'))
        };
        
        // Отправка данных в бота
        tg.sendData(JSON.stringify(taskData));
    });
    
    // Загрузка задач с примерами решений
    async function loadUserTasks() {
        const exampleTasks = [
            {
                id: 1,
                text: "Написать отчет по маркетингу",
                deadline: "2023-12-20T18:00",
                status: "completed",
                solution: "Отчет подготовлен с анализом KPI за квартал, приложены графики",
                photos: []
            },
            {
                id: 2,
                text: "Разработать презентацию продукта",
                deadline: "2023-12-15T14:00",
                status: "in_progress",
                solution: "",
                photos: []
            }
        ];
        
        taskList.innerHTML = '';
        exampleTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.innerHTML = `
                <div class="task-id">Задача #${task.id}</div>
                <div class="task-text">${task.text}</div>
                <div class="task-deadline">${new Date(task.deadline).toLocaleString()}</div>
                ${task.solution ? `
                <div class="solution-card">
                    <strong>Решение:</strong>
                    <p>${task.solution}</p>
                </div>` : ''}
            `;
            taskList.appendChild(taskCard);
        });
    }
    
    // Инициализация
    document.querySelector('.tab[data-tab="tasks"]').addEventListener('click', loadUserTasks);
});
