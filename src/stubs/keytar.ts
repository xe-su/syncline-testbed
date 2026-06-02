export const setPassword = async (_service: string, _account: string, _password: string) => {}
export const getPassword = async (_service: string, _account: string) => null as string | null
export const deletePassword = async (_service: string, _account: string) => false
export default { setPassword, getPassword, deletePassword }
