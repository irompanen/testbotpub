document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide(); // Скрываем кнопку "Назад"

    // Скрытие клавиатуры при фокусе на текстовом поле
    document.getElementById('taskText').addEventListener('focus', function() {
        tg.HapticFeedback.impactOccurred('light');
        setTimeout(() => tg.close(), 300); // Небольшая задержка для плавности
    });

    // Обработчик для выпадающих решений
    function setupSolutionDropdowns() {
        document.querySelectorAll('.solution-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const solutionContent = this.nextElementSibling;
                const icon = this.querySelector('.dropdown-icon');
                
                solutionContent.classList.toggle('show');
                icon.classList.toggle('rotated');
                
                // Прокрутка к открытому решению
                if (solutionContent.classList.contains('show')) {
                    solutionContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }

    // Загрузка задач с выпадающими решениями
    async function loadUserTasks() {
        const exampleTasks = [
            {
                id: 1,
                text: "Подготовить презентацию для клиента",
                deadline: "2023-12-15T18:00",
                status: "completed",
                solution: "Презентация включает 15 слайдов с анализом рынка и нашими предложениями. Все графики актуализированы.",
                photos: []
            },
            {
                id: 2,
                text: "Написать техническое задание",
                deadline: "2023-12-10T12:00",
                status: "completed",
                solution: "ТЗ содержит все требования заказчика, сроки и этапы реализации проекта.",
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
                <div class="task-deadline">⏰ ${new Date(task.deadline).toLocaleString('ru-RU')}</div>
                <div class="task-status ${task.status === 'completed' ? 'status-completed' : 'status-in-progress'}">
                    ${task.status === 'completed' ? 'Завершена' : 'В работе'}
                </div>
                
                ${task.solution ? `
                <div class="solution-dropdown">
                    <button class="solution-toggle">
                        Показать решение
                        <svg class="dropdown-icon" width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="${task.status === 'completed' ? '#388e3c' : '#ff8f00'}" stroke-width="2"/>
                        </svg>
                    </button>
                    <div class="solution-content">
                        <p>${task.solution}</p>
                    </div>
                </div>` : ''}
            `;
            taskList.appendChild(taskCard);
        });

        setupSolutionDropdowns();
    }

    // Остальной код остаётся без изменений...
    document.querySelector('.tab[data-tab="tasks"]').addEventListener('click', loadUserTasks);
});
