const STORAGE_KEY = 'myWorkoutApp';

// Inicializa a estrutura de dados se não existir
const initializeData = () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        const initialData = {
            workouts: {
                'Segunda-feira': [],
                'Terça-feira': [],
                'Quarta-feira': [],
                'Quinta-feira': [],
                'Sexta-feira': [],
                'Sábado': []
            },
            completedDays: {} // { 'Segunda-feira': true, 'Terça-feira': false }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }
    // No início de um novo dia (ou a cada reinício do app), resetar status de conclusão
    // Poderíamos ter uma lógica mais robusta aqui para resetar à meia-noite
    resetCompletedDaysIfNewDay();
};

const resetCompletedDaysIfNewDay = () => {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const lastResetDate = storedData.lastResetDate;
    const today = new Date().toDateString();

    if (lastResetDate !== today) {
        storedData.completedDays = {}; // Limpa todos os dias concluídos
        storedData.lastResetDate = today;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    }
}

// Carrega todos os dados do localStorage
const loadData = () => {
    initializeData(); // Garante que a estrutura básica existe
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
};

// Salva todos os dados no localStorage
const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Funções específicas para gerenciar treinos
const getWorkoutsForDay = (day) => {
    const data = loadData();
    return data.workouts[day] || [];
};

const addWorkout = (day, workout) => {
    const data = loadData();
    // Gera um ID único para o treino
    workout.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    data.workouts[day].push(workout);
    saveData(data);
};

const updateWorkout = (day, workoutId, updatedWorkout) => {
    const data = loadData();
    const dayWorkouts = data.workouts[day];
    const index = dayWorkouts.findIndex(w => w.id === workoutId);
    if (index !== -1) {
        data.workouts[day][index] = { ...updatedWorkout, id: workoutId }; // Garante que o ID não muda
        saveData(data);
        return true;
    }
    return false;
};

const deleteWorkout = (day, workoutId) => {
    const data = loadData();
    data.workouts[day] = data.workouts[day].filter(w => w.id !== workoutId);
    saveData(data);
};

// Funções específicas para gerenciar status de conclusão do dia
const markDayAsCompleted = (day, completed = true) => {
    const data = loadData();
    data.completedDays[day] = completed;
    saveData(data);
};

const isDayCompleted = (day) => {
    const data = loadData();
    return data.completedDays[day] || false;
};

// Exporta as funções para serem usadas em outros módulos
export {
    initializeData,
    loadData,
    saveData,
    getWorkoutsForDay,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    markDayAsCompleted,
    isDayCompleted
};