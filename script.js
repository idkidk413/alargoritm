const CORS_PROXY = 'https://corsproxysmh.herokuapp.com';

const zeroPad = (num, size) => String(num).padStart(size, '0');
const outputUpdate = text => document.querySelector('#output').innerHTML = text;


document.querySelector('#btn-search').onclick = async () => {
    const lectureTime = document.querySelector('#lecture-time').value;

    if (lectureTime != '') {
        outputUpdate('Söker...');
        const response_1 = await fetch(`${CORS_PROXY}/https://www.vasttrafik.se/api/token/public/renew?expiredToken=b911de69-cb14-38d3-908b-b48c6fe14b0f`);

        if (response_1.ok) {
            const jsonToken = await response_1.json();
            const token = jsonToken['token'];

            /* (7200 seconds is 2 hours) */
            const lectureTimeAhead = new Date(new Date(lectureTime) - 7200 * 1000).toISOString();

            const response_2 = await fetch(
                `${CORS_PROXY}/https://api.vasttrafik.se/pr/v3/journeys?dateTimeRelatesTo=departure&originGid=0000000800000003&destinationGid=0000000800000001&dateTime=${lectureTimeAhead}&transportModes=train&transportSubModes=vasttagen&transportSubModes=regionalTrain&originWalk=1,0,2000&originCar=0&originBike=0&originPark=0`,
                {headers: {'Authorization': `Bearer ${token}`}}
            );

            if (response_2.ok) {
                const jsonResults = await response_2.json();
                const tripLegs = jsonResults['results'].map(i => i['tripLegs'][0]);

                for (let i of tripLegs.slice().reverse()) {
                    const arrivalTime = new Date(i['plannedArrivalTime']);

                    if ((new Date(lectureTime) - 600 * 1000) >= arrivalTime.getTime()) {
                        const trainType = i['line']['name'];
                        const trainPlatform = i['origin']['stopPoint']['track'];
                        const trainDepartureTime = new Date(i['plannedDepartureTime']);

                        /* Fredriksberg till Sjukhusentrén Falköping */
                        const busDepartureTimes = [
                            {5: [33, 53]},
                            {6: [13, 33, 53]},
                            {7: [13, 33, 53]},
                            {8: [13, 33, 53]},
                            {9: [13, 33, 53]},
                            {10: [13, 33, 53]},
                            {11: [13, 33, 53]},
                            {12: [13, 33, 53]},
                            {13: [13, 33, 53]},
                            {14: [13, 33, 53]},
                            {15: [13, 33, 53]},
                            {16: [13, 33, 53]},
                            {17: [13, 33, 53]}
                        ]
                        for (let i of busDepartureTimes.slice().reverse()) {
                            for (let key in i) {
                                const values = i[key];
                                for (let value of values.slice().reverse()) {
                                    const timeBus = new Date();
                                    timeBus.setHours(hours=key, min=value, sec=0, ms=0);

                                    const timeTrain = new Date();
                                    timeTrain.setHours(hours=trainDepartureTime.getHours(), min=trainDepartureTime.getMinutes(), 0, 0);

                                    if (timeBus.getTime() <= (timeTrain.getTime() - 600 * 1000)) {
                                        const alarmTime = new Date(timeBus - 5400 * 1000);
                                        outputUpdate(
                                            // '<span style="color:#518afe;font-size:1.2rem">Lämpligaste tider <span style="color:#1ce519">avgjorda</span>!</span>\n\n' +
                                            `<span style="color:#518afe">•</span> Ställ in alarm på kl. <span style="color:#518afe">${zeroPad(alarmTime.getHours(), 2)}:${zeroPad(alarmTime.getMinutes(), 2)}</span>\n` +
                                            `<span style="color:#518afe">•</span> Ta bussen kl. <span style="color:#518afe">${zeroPad(key, 2)}:${zeroPad(value, 2)}</span>\n` +
                                            `<span style="color:#518afe">•</span> Ta <span style="color:#518afe">${trainType}</span> (på <span style="color:#518afe">spår ${trainPlatform}</span>) kl. <span style="color:#518afe">${zeroPad(trainDepartureTime.getHours(), 2)}:${zeroPad(trainDepartureTime.getMinutes(), 2)}</span>\n` +
                                            `<span style="color:#518afe">•</span> Du är framme kl. <span style="color:#518afe">${zeroPad(arrivalTime.getHours(), 2)}:${zeroPad(arrivalTime.getMinutes(), 2)}</span> :)`
                                        );
                                        console.log(`SET ALARM > ${zeroPad(alarmTime.getHours(), 2)}:${zeroPad(alarmTime.getMinutes(), 2)}`);
                                        console.log(`SET NOTE  > Buss: ${zeroPad(key, 2)}:${zeroPad(value, 2)} | ${trainType} (Spår ${trainPlatform}): ${zeroPad(trainDepartureTime.getHours(), 2)}:${zeroPad(trainDepartureTime.getMinutes(), 2)} => ${zeroPad(arrivalTime.getHours(), 2)}:${zeroPad(arrivalTime.getMinutes(), 2)}`)
                                        return;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            } else {
                outputUpdate('<span style="color:#518afe">Ett fel har uppstått.</span>');
                console.log(`Error code: ${response_1.status}`);
            }
        } else {
            outputUpdate('<span style="color:#518afe">Ett fel har uppstått.</span>');
            console.log(`Error code: ${response_1.status}`);
        }
    } else {
        outputUpdate('<span style="color:#518afe">Fyll i ett datum ovan...</span>');
    }
}
