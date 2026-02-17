const STORAGE_KEY = 'smart_college_db';

const initialData = {
    students: [],
    faculty: [],
    attendance: [],
    fees: []
};

export const getDatabase = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialData;
};

export const saveDatabase = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getCollection = (collectionName) => {
    const db = getDatabase();
    return db[collectionName] || [];
};

export const addItem = (collectionName, item) => {
    const db = getDatabase();
    const collection = db[collectionName] || [];
    const newItem = { id: crypto.randomUUID(), ...item, createdAt: new Date().toISOString() };
    collection.push(newItem);
    db[collectionName] = collection;
    saveDatabase(db);
    return newItem;
};

export const updateItem = (collectionName, id, updates) => {
    const db = getDatabase();
    const collection = db[collectionName] || [];
    const index = collection.findIndex((item) => item.id === id);
    if (index !== -1) {
        collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
        db[collectionName] = collection;
        saveDatabase(db);
        return collection[index];
    }
    return null;
};

export const deleteItem = (collectionName, id) => {
    const db = getDatabase();
    const collection = db[collectionName] || [];
    const updatedCollection = collection.filter((item) => item.id !== id);
    db[collectionName] = updatedCollection;
    saveDatabase(db);
};

// Initialize DB if empty
if (!localStorage.getItem(STORAGE_KEY)) {
    saveDatabase(initialData);
}
