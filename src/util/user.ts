import {useUserStore} from "@/stores/user";
import {computed} from "vue";

const {user} = useUserStore()

// 不用三元，而是每个都判断，因为有 ADMIN 和 BANNED
export const roleText = computed(() => {
    if (user?.role === 'ADMIN') {
        return '管理员';
    } else if (user?.role === 'TEACHER') {
        return '教师';
    } else if (user?.role === 'STUDENT') {
        return '学生';
    } else if (user?.role === 'BANNED') {
        return '封禁用户';
    }
});
export const idLabel = computed(() => {
    if (user?.role === 'ADMIN') {
        return '管理员ID';
    } else if (user?.role === 'TEACHER') {
        return '职工号';
    } else if (user?.role === 'STUDENT') {
        return '学号';
    } else if (user?.role === 'BANNED') {
        return 'ID';
    }
});