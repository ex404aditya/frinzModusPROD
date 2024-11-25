export function convertToUUID(input: string): string {
    // Split the input string into an array of numbers
    const byteArray = input.split(",").map<u8>((num: string) => u8(parseInt(num, 10)));

    if (byteArray.length !== 16) {
        throw new Error("Invalid input length. UUID requires exactly 16 bytes.");
    }

    // Convert the byte array into a UUID string
    const hexArray: Array<string> = new Array<string>(16);
    for (let i = 0; i < byteArray.length; i++) {
        hexArray[i] = byteArray[i].toString(16).padStart(2, "0");
    }

    const uuid = 
        hexArray.slice(0, 4).join("") + "-" +
        hexArray.slice(4, 6).join("") + "-" +
        hexArray.slice(6, 8).join("") + "-" +
        hexArray.slice(8, 10).join("") + "-" +
        hexArray.slice(10).join("");

    return uuid;
}