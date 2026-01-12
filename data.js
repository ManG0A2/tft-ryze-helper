const REGIONS = [
    "빌지워터", "데마시아", "프렐요드", "아이오니아", "이슈탈", "녹서스", "필트오버",
    "그림자 군도", "슈리마", "타곤", "공허", "자운", "요들"
];

// Trait activation thresholds (min units needed for first level)
const TRAIT_RULES = {
    "빌지워터": 3,
    "데마시아": 3,
    "프렐요드": 3,
    "아이오니아": 3,
    "이슈탈": 3,
    "녹서스": 3,
    "필트오버": 2,
    "그림자 군도": 2,
    "슈리마": 2,
    "타곤": 1, // Easy unlock
    "공허": 2,
    "자운": 3,
    "요들": 2,
    // Classes
    "난동꾼": 2,
    "요새": 2,
    "도전자": 2,
    "기원자": 2,
    "사수": 2,
    "학살자": 2,
    "마법사": 2,
    "책략가": 2,
    "전쟁기계": 2, // Juggernaut
    "암살자": 2 // Rogue/Assassin equivalent
};

const CHAMPIONS = [
    // 1 Cost
    { name: "카시오페아", cost: 1, traits: ["녹서스", "슈리마", "기원자"] },
    { name: "초가스", cost: 1, traits: ["공허", "난동꾼"] },
    { name: "이렐리아", cost: 1, traits: ["아이오니아", "도전자"] },
    { name: "진", cost: 1, traits: ["아이오니아", "사수"] }, // Changed Deadeye to Gunner/Slayer generic or just leave strictly relevant traits
    { name: "케일", cost: 1, traits: ["데마시아", "학살자"] },
    { name: "말자하", cost: 1, traits: ["공허", "마법사"] },
    { name: "마오카이", cost: 1, traits: ["그림자 군도", "요새"] },
    { name: "오리아나", cost: 1, traits: ["필트오버", "마법사"] },
    { name: "뽀삐", cost: 1, traits: ["데마시아", "요들", "요새"] },
    { name: "레넥톤", cost: 1, traits: ["슈리마", "난동꾼"] },
    { name: "사미라", cost: 1, traits: ["녹서스", "도전자"] },
    { name: "트리스타나", cost: 1, traits: ["요들", "사수"] },
    { name: "비에고", cost: 1, traits: ["그림자 군도", "암살자"] },

    // 2 Cost
    { name: "애쉬", cost: 2, traits: ["프렐요드", "사수"] },
    { name: "갈리오", cost: 2, traits: ["데마시아", "기원자"] },
    { name: "징크스", cost: 2, traits: ["자운", "사수"] },
    { name: "카사딘", cost: 2, traits: ["공허", "요새"] },
    { name: "클레드", cost: 2, traits: ["녹서스", "요들", "학살자"] },
    { name: "세트", cost: 2, traits: ["아이오니아", "전쟁기계"] },
    { name: "소라카", cost: 2, traits: ["타곤", "기원자"] },
    { name: "스웨인", cost: 2, traits: ["녹서스", "책략가", "마법사"] },
    { name: "탈리야", cost: 2, traits: ["슈리마", "마법사"] }, // Multicaster -> Mage/Sorc approx
    { name: "티모", cost: 2, traits: ["요들", "책략가", "마법사"] },
    { name: "바이", cost: 2, traits: ["필트오버", "난동꾼"] },
    { name: "워윅", cost: 2, traits: ["자운", "전쟁기계", "도전자"] },
    { name: "제드", cost: 2, traits: ["아이오니아", "암살자", "학살자"] },

    // 3 Cost
    { name: "아크샨", cost: 3, traits: ["슈리마", "사수"] },
    { name: "다리우스", cost: 3, traits: ["녹서스", "전쟁기계"] },
    { name: "에코", cost: 3, traits: ["자운", "필트오버", "암살자"] }, // Double Region!
    { name: "가렌", cost: 3, traits: ["데마시아", "전쟁기계"] },
    { name: "제이스", cost: 3, traits: ["필트오버", "사수"] },
    { name: "칼리스타", cost: 3, traits: ["그림자 군도", "도전자"] },
    { name: "카르마", cost: 3, traits: ["아이오니아", "기원자"] },
    { name: "카타리나", cost: 3, traits: ["녹서스", "암살자"] },
    { name: "리산드라", cost: 3, traits: ["프렐요드", "기원자"] },
    { name: "렉사이", cost: 3, traits: ["공허", "난동꾼"] },
    { name: "소나", cost: 3, traits: ["데마시아", "마법사"] },
    { name: "타릭", cost: 3, traits: ["타곤", "요새", "마법사"] },
    { name: "벨코즈", cost: 3, traits: ["공허", "마법사"] },

    // 4 Cost
    { name: "아펠리오스", cost: 4, traits: ["타곤", "사수"] },
    { name: "아지르", cost: 4, traits: ["슈리마", "책략가"] },
    { name: "그웬", cost: 4, traits: ["그림자 군도", "학살자"] },
    { name: "자르반 4세", cost: 4, traits: ["데마시아", "책략가"] },
    { name: "카이사", cost: 4, traits: ["공허", "도전자"] },
    { name: "럭스", cost: 4, traits: ["데마시아", "마법사"] },
    { name: "나서스", cost: 4, traits: ["슈리마", "전쟁기계"] },
    { name: "세주아니", cost: 4, traits: ["프렐요드", "난동꾼"] },
    { name: "쉔", cost: 4, traits: ["아이오니아", "요새", "기원자"] },
    { name: "우르곳", cost: 4, traits: ["자운", "사수"] }, // Deadeye -> Gunner approx
    { name: "야스오", cost: 4, traits: ["아이오니아", "도전자"] },
    { name: "제리", cost: 4, traits: ["자운", "사수"] },

    // 5 Cost
    { name: "아리", cost: 5, traits: ["아이오니아", "마법사"] },
    { name: "벨베스", cost: 5, traits: ["공허"] }, // Empress specific class ignored
    { name: "하이머딩거", cost: 5, traits: ["필트오버", "요들"] }, // Technogenius ignored
    { name: "크산테", cost: 5, traits: ["슈리마", "요새"] },
    { name: "라이즈", cost: 5, traits: ["기원자"] }, // Wanderer is his unique trait, effectively "Ryze"
    { name: "세나", cost: 5, traits: ["그림자 군도", "사수"] },
    { name: "사이온", cost: 5, traits: ["녹서스", "난동꾼"] },
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { REGIONS, TRAIT_RULES, CHAMPIONS };
}
