import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserVo } from '@/api/types.gen';

export const useUserStore = defineStore('user', () => {
    const user = ref<UserVo | null>(null);

    function setUser(userData: UserVo) {
        user.value = userData;
    }

    function clearUser() {
        user.value = null;
    }

    return { user, setUser, clearUser };
});
