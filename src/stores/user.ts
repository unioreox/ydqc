import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserVO } from '@/api/types.gen';

export const useUserStore = defineStore('user', () => {
    const user = ref<UserVO | null>(null);

    function setUser(userData: UserVO) {
        user.value = userData;
    }

    function clearUser() {
        user.value = null;
    }

    return { user, setUser, clearUser };
});
