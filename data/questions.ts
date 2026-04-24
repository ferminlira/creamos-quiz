export interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswerIndex: number;
}

export const quizQuestions: Question[] = [
    {
        id: 1,
        text: "Which of these domains is associated with our venture capital / investment projects?",
        options: ["www.ito.ms", "www.resbite.com", "www.goodaddventures.com", "www.napp.tech"],
        correctAnswerIndex: 2, // goodaddventures.com
    },
    {
        id: 2,
        text: "What is the primary service offered by Resbite (www.resbite.com)?",
        options: ["Restaurant management software", "Creative design assets", "Sleep tracking tech", "Cloud hosting"],
        correctAnswerIndex: 0, // Placeholder
    },
    {
        id: 3,
        text: "Which of our tech initiatives focuses on sleep or rest applications?",
        options: ["Ito", "Napp.tech", "Good Add Ventures", "Creamos"],
        correctAnswerIndex: 1, // Napp.tech
    },
    {
        id: 4,
        text: "What year was Creamos officially founded?",
        options: ["2015", "2018", "2020", "2022"],
        correctAnswerIndex: 1, // Placeholder
    },
    {
        id: 5,
        text: "Which of the following is a core typography used in the Creamos brand identity?",
        options: ["Inter", "Roboto", "Poppins", "Open Sans"],
        correctAnswerIndex: 2, // Poppins
    }
];