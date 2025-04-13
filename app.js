document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Инициализация
    const user = tg.initDataUnsafe.user;
    const userId = tg.initDataUnsafe.user?.id;
    let photos = [];
    
    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadline = document.getElementById('deadline');
    const photoInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const taskList = document.getElementById('taskList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const notification = document.getElementById('notification');
    
    // Показываем уведомление
    function showNotification(message, duration = 3000) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
    // Переключение между вкладками
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tasks') {
                loadUserTasks();
            }
        });
    });
    
    // Загрузка задач пользователя
    async function loadUserTasks() {
        taskList.innerHTML = '<p class="loading">Загрузка задач...</p>';
        
        try {
            // В реальном приложении здесь будет запрос к вашему бэкенду
            // Для примера используем тестовые данные
            const tasks = await fetchUserTasksFromBot(userId);
            
            if (tasks.length === 0) {
                taskList.innerHTML = '<p>У вас пока нет задач</p>';
                return;
            }
            
            taskList.innerHTML = '';
            
            tasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                
                let statusClass = 'status-new';
                let statusText = 'Новая';
                
                if (task.status === 101) {
                    statusClass = 'status-in-progress';
                    statusText = 'В работе';
                } else if (task.status === 301) {
                    statusClass = 'status-completed';
                    statusText = 'На проверке';
                } else if (task.status === 401) {
                    statusClass = 'status-completed';
                    statusText = 'Завершена';
                }
                
                taskCard.innerHTML = `
                    <div class="task-id">Задача #${task.id}</div>
                    <div class="task-text">${task.text}</div>
                    <div class="task-deadline">${formatDate(task.deadline)}</div>
                    <div class="task-status ${statusClass}">${statusText}</div>
                `;
                
                taskList.appendChild(taskCard);
            });
        } catch (error) {
            console.error('Ошибка загрузки задач:', error);
            taskList.innerHTML = '<p>Произошла ошибка при загрузке задач</p>';
        }
    }
    
    // Форматирование даты
    function formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }
    
    // Загрузка задач через бота (заглушка)
    async function fetchUserTasksFromBot(userId) {
        // В реальном приложении здесь должен быть запрос к вашему боту
        // или API для получения задач пользователя
        
        // Для примера возвращаем тестовые данные
        return [
            {
                id: 123,
                text: "Подготовить презентацию для клиента",
                deadline: "2023-12-15 18:00",
                status: 101
            },
            {
                id: 124,
                text: "Написать отчет за месяц",
                deadline: "2023-12-10 12:00",
                status: 301
            }
        ];
    }
    
    // Обработка загрузки фото
    photoInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        photos = [];
        
        Array.from(e.target.files).forEach(file => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
                photos.push(e.target.result);
            }
            
            reader.readAsDataURL(file);
        });
    });
    
    // Отправка формы
    taskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!taskText.value.trim()) {
            showNotification('Пожалуйста, опишите задачу');
            return;
        }
        
        if (!deadline.value) {
            showNotification('Укажите срок выполнения');
            return;
        }
        
        const taskData = {
            action: 'create_task',
            userId: userId,
            text: taskText.value,
            deadline: deadline.value,
            photos: photos
        };
        
        try {
            // Отправляем данные в бота
            tg.sendData(JSON.stringify(taskData));
            
            // Показываем уведомление об успехе
            showNotification('Задача успешно создана!');
            
            // Очищаем форму
            taskForm.reset();
            preview.innerHTML = '';
            photos = [];
            
            // Переключаемся на вкладку с задачами
            document.querySelector('.tab[data-tab="tasks"]').click();
            
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            showNotification('Ошибка при создании задачи');
        }
    });
    
    // Инициализация
    if (user) {
        console.log(`Пользователь: ${user.first_name} (ID: ${user.id})`);
    }
    
    // Загружаем задачи при первом открытии вкладки
    document.querySelector('.tab[data-tab="tasks"]').addEventListener('click', loadUserTasks);
    
    // Закрытие приложения
    Telegram.WebApp.onEvent('mainButtonClicked', function() {
        tg.close();
    });
});
