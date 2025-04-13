document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide();

    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadlineInput = document.getElementById('deadline');
    const quickDeadlineBtns = document.querySelectorAll('.quick-deadline button');
    const charCounter = document.getElementById('charsRemaining');
    const maxChars = 1000;

    // Счетчик символов
    taskText.addEventListener('input', function() {
        const remaining = maxChars - this.value.length;
        charCounter.textContent = remaining;
        charCounter.style.color = remaining < 50 ? '#ff6b6b' : '#666';
    });

    // Быстрый выбор срока
    quickDeadlineBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const hours = parseInt(this.dataset.hours);
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + hours);
            deadlineInput.value = deadline.toISOString().slice(0, 16);
        });
    });

    // Установка дефолтного срока (1 час)
    quickDeadlineBtns[0].click();

    // Загрузка примеров задач
    loadExampleTasks();

    function loadExampleTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        // Пример задачи "Создана"
        const createdTask = createTaskCard({
            id: 1,
            text: "Подготовить презентацию для клиента",
            deadline: new Date(Date.now() + 3600000).toISOString(),
            status: "created"
        });
        taskList.appendChild(createdTask);
        
        // Пример задачи "Уточнение"
        const clarificationTask = createTaskCard({
            id: 2,
            text: "Разработать логотип для нового продукта",
            deadline: new Date(Date.now() + 86400000).toISOString(),
            status: "clarification",
            question: "Какой стиль логотипа вы предпочитаете?"
        });
        taskList.appendChild(clarificationTask);
    }

    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.status === 'clarification' ? 'task-clarification' : ''}`;
        
        let statusText, statusClass;
        if (task.status === 'created') {
            statusText = 'Создана';
            statusClass = 'status-created';
        } else {
            statusText = 'Уточнение';
            statusClass = 'status-in-progress';
        }
        
        let clarificationSection = '';
        if (task.status === 'clarification' && task.question) {
            clarificationSection = `
                <div class="clarification-section">
                    <div class="clarification-question">${task.question}</div>
                    <textarea class="clarification-input" placeholder="Ваш ответ..." maxlength="500"></textarea>
                    <div class="clarification-counter"><span class="clarification-chars">500</span>/500</div>
                </div>
            `;
        }
        
        taskCard.innerHTML = `
            <div class="task-id">Задача #${task.id}</div>
            <div class="task-text">${task.text}</div>
            <div class="task-deadline">⏰ ${new Date(task.deadline).toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="task-status ${statusClass}">${statusText}</div>
            ${clarificationSection}
        `;
        
        // Обработчик счетчика символов для уточнения
        const clarificationInput = taskCard.querySelector('.clarification-input');
        if (clarificationInput) {
            const counter = taskCard.querySelector('.clarification-chars');
            clarificationInput.addEventListener('input', function() {
                const remaining = 500 - this.value.length;
                counter.textContent = remaining;
                counter.style.color = remaining < 50 ? '#ff6b6b' : '#666';
            });
        }
        
        return taskCard;
    }

    // Остальная логика (обработка фото, отправка формы) остается без изменений
    // ...
});
