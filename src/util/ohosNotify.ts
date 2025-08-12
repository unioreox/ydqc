import { showDialog, showNotify, type NotifyType } from "vant";

export default function showOHOSNotify(isNotOHOS: boolean, isAndroidApp: boolean, type: NotifyType | undefined, msg: string) {
    if (isAndroidApp) {
        window.AndroidAPP.sendNotify(type, msg);
    } else if (isNotOHOS) {
        showNotify({ type: type, message: msg });
    } else {
        window.location.href = 'ohos://notifyAbility?type='+ type + '&msg=' + msg;
        // let titleName: string = '提示';
        // if(type === 'success'){
        //     titleName = '成功';
        // }else if(type === 'danger'){
        //     titleName = '错误';
        // }else if(type === 'warning'){
        //     titleName = '警告';
        // }
        // showDialog({
        //     title: titleName,
        //     message: msg,
        // }).then(() => {
        //     // on close
        // });
    }
}